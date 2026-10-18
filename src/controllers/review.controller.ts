import type { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import { type AuthRequest } from "../middlewares/auth";
import { queryInt } from "../utils/query";

const reviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  tenant: { select: { id: true, name: true } },
  property: { select: { id: true, title: true, location: true } },
} as const;

// 1. Create a Review (Tenant Only)
export const createReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, rating, comment } = req.body;

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId as string },
    });

    if (!property) {
      throw new AppError(404, "Property not found");
    }

    // Verify tenant has an approved, active (paid) or completed rental request
    // for this property. Payment flips APPROVED -> ACTIVE; finished stays count.
    const validRental = await prisma.rentalRequest.findFirst({
      where: {
        propertyId,
        tenantId,
        status: { in: ["APPROVED", "ACTIVE", "COMPLETED"] },
      },
    });

    if (!validRental) {
      throw new AppError(
        403,
        "You can only review properties that you have an approved or active rental request for",
      );
    }

    // Check if tenant already reviewed this property
    const existingReview = await prisma.review.findFirst({
      where: {
        propertyId,
        tenantId,
      },
    });

    if (existingReview) {
      throw new AppError(
        400,
        "You have already submitted a review for this property",
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        propertyId,
        tenantId,
        rating,
        comment,
      },
      select: reviewSelect,
    });

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Reviews for a Specific Property with Average Rating Calculation (Public)
export const getPropertyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const propertyId = req.params.propertyId as string;

    const reviews = await prisma.review.findMany({
      where: { propertyId },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        tenant: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate average rating
    const aggregate = await prisma.review.aggregate({
      where: { propertyId },
      _avg: {
        rating: true,
      },
      _count: {
        _all: true,
      },
    });

    const avg = aggregate._avg?.rating;
    const averageRating = avg ? Number(avg.toFixed(1)) : 0;
    const totalReviews = aggregate._count?._all ?? 0;

    res.status(200).json({
      success: true,
      message: "Property reviews fetched successfully",
      data: {
        averageRating,
        totalReviews,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Latest reviews across the marketplace (Public) — e.g. homepage testimonials
export const getLatestReviews = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const limit = queryInt(req.query["limit"], { min: 1, max: 24, fallback: 6, clamp: true });
    const minRating = queryInt(req.query["minRating"], { min: 1, max: 5, fallback: 1 });

    const reviews = await prisma.review.findMany({
      where: { rating: { gte: minRating } },
      select: reviewSelect,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    res.status(200).json({
      success: true,
      message: "Latest reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Reviews written by the authenticated tenant
export const getMyReviews = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { tenantId: req.user!.id },
      select: reviewSelect,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Your reviews fetched successfully",
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};
