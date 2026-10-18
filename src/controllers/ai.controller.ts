import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import {
  chatWithAssistant,
  generateAdminInsights,
  isAIEnabled,
  suggestSearch,
  writePropertyDescription,
  type AIFailureReason,
} from "../services/ai.service";
import { getSummariesByIds } from "../services/property.service";
import { getAdminStats } from "../services/stats.service";
import type { ChatInput, PropertyDescriptionInput } from "../validations/ai.validation";

const NOT_CONFIGURED = "AI assistant is not configured";

/** Map an AI failure to an HTTP error for endpoints that require AI. */
const failureToError = (reason: AIFailureReason): AppError => {
  switch (reason) {
    case "disabled":
      return new AppError(503, NOT_CONFIGURED);
    case "rate_limited":
      return new AppError(503, "The AI assistant is busy right now. Please try again in a moment.");
    case "refusal":
      return new AppError(422, "The AI assistant couldn't help with this request.");
    default:
      return new AppError(502, "The AI assistant is temporarily unavailable. Please try again.");
  }
};

// GET /ai/status
export const getStatus = (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "AI status fetched successfully",
    data: { enabled: isAIEnabled() },
  });
};

type Suggestion = {
  text: string;
  type: "property" | "location" | "category" | "query";
  propertyId?: string;
  categoryId?: string;
  location?: string;
};

type Filters = {
  location?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
};

const saneMoney = (n: number | null): number | undefined =>
  n !== null && Number.isFinite(n) && n > 0 && n <= 1_000_000 ? Math.round(n) : undefined;

// POST /ai/search-suggestions — DB matches first, AI extras when available
export const searchSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { query } = req.body as { query: string };
    const contains = { contains: query, mode: "insensitive" as const };

    const [locationGroups, categories, properties] = await Promise.all([
      prisma.property.groupBy({
        by: ["location"],
        where: { isAvailable: true, location: contains },
        _count: { _all: true },
        orderBy: { _count: { location: "desc" } },
        take: 2,
      }),
      prisma.category.findMany({
        where: { name: contains },
        select: { id: true, name: true },
        take: 2,
      }),
      prisma.property.findMany({
        where: {
          isAvailable: true,
          OR: [{ title: contains }, { location: contains }, { category: { name: contains } }],
        },
        select: { id: true, title: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const suggestions: Suggestion[] = [];
    const seen = new Set<string>();
    const push = (s: Suggestion) => {
      const key = s.text.trim().toLowerCase();
      if (!key || seen.has(key) || suggestions.length >= 8) return;
      seen.add(key);
      suggestions.push(s);
    };

    const basic: Suggestion[] = [
      ...locationGroups.map((g): Suggestion => ({
        text: g.location,
        type: "location",
        location: g.location,
      })),
      ...categories.map((c): Suggestion => ({ text: c.name, type: "category", categoryId: c.id })),
      ...properties.map((p): Suggestion => ({ text: p.title, type: "property", propertyId: p.id })),
    ].slice(0, 5);
    basic.forEach(push);

    let filters: Filters = {};
    let source: "ai" | "basic" = "basic";

    if (isAIEnabled()) {
      try {
        const [allCategories, allLocations] = await Promise.all([
          prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
          prisma.property.groupBy({
            by: ["location"],
            where: { isAvailable: true },
            orderBy: { location: "asc" },
          }),
        ]);
        const categoryIds = new Set(allCategories.map((c) => c.id));

        const ai = await suggestSearch(query, {
          categories: allCategories,
          locations: allLocations.map((l) => l.location),
        });

        if (ai.ok) {
          source = "ai";
          for (const s of ai.data.suggestions.slice(0, 4)) {
            const text = s.text.trim().slice(0, 80);
            if (!text) continue;
            const item: Suggestion = { text, type: s.type };
            if (s.type === "category") {
              if (!s.categoryId || !categoryIds.has(s.categoryId)) item.type = "query";
              else item.categoryId = s.categoryId;
            }
            if (s.type === "location" && s.location?.trim()) {
              item.location = s.location.trim().slice(0, 80);
            }
            push(item);
          }

          const f = ai.data.filters;
          const location = f.location?.trim();
          if (location && location.length <= 80) filters.location = location;
          if (f.categoryId && categoryIds.has(f.categoryId)) filters.categoryId = f.categoryId;
          let minPrice = saneMoney(f.minPrice);
          let maxPrice = saneMoney(f.maxPrice);
          if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
            [minPrice, maxPrice] = [maxPrice, minPrice];
          }
          if (minPrice !== undefined) filters.minPrice = minPrice;
          if (maxPrice !== undefined) filters.maxPrice = maxPrice;
          if (
            f.bedrooms !== null &&
            Number.isInteger(f.bedrooms) &&
            f.bedrooms >= 0 &&
            f.bedrooms <= 50
          ) {
            filters.bedrooms = f.bedrooms;
          }
        }
      } catch (err) {
        // AI enrichment must never fail the request.
        console.error("[ai:search-suggestions] enrichment failed:", err);
        filters = {};
      }
    }

    res.status(200).json({
      success: true,
      message: "Search suggestions fetched successfully",
      data: { suggestions: suggestions.slice(0, 8), filters, source },
    });
  } catch (error) {
    next(error);
  }
};

// POST /ai/chat
export const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isAIEnabled()) throw new AppError(503, NOT_CONFIGURED);

    const { messages } = req.body as ChatInput;
    const result = await chatWithAssistant(messages);

    if (!result.ok) {
      if (result.reason === "refusal") {
        return res.status(200).json({
          success: true,
          message: "Assistant reply generated",
          data: {
            reply:
              "Sorry, I can't help with that. I can help you find a rental on RentNest, compare listings, or explain how requests, payments and reviews work.",
            properties: [],
          },
        });
      }
      throw failureToError(result.reason);
    }

    const properties = await getSummariesByIds(result.data.propertyIds, { isAvailable: true });

    res.status(200).json({
      success: true,
      message: "Assistant reply generated",
      data: { reply: result.data.reply, properties },
    });
  } catch (error) {
    next(error);
  }
};

// POST /ai/property-description (LANDLORD | ADMIN)
export const propertyDescription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!isAIEnabled()) throw new AppError(503, NOT_CONFIGURED);

    const body = req.body as PropertyDescriptionInput;
    const result = await writePropertyDescription(body);
    if (!result.ok) throw failureToError(result.reason);

    res.status(200).json({
      success: true,
      message: "Description generated",
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

// GET /ai/admin-insights (ADMIN)
export const adminInsights = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!isAIEnabled()) throw new AppError(503, NOT_CONFIGURED);

    const stats = await getAdminStats();
    const result = await generateAdminInsights(stats);
    if (!result.ok) throw failureToError(result.reason);

    res.status(200).json({
      success: true,
      message: "Insights generated",
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};
