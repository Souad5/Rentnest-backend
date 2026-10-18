import { assertPropertyDeletable } from "../services/rental.service";
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import type { AuthRequest } from "../middlewares/auth";
import {
  getRatingMap,
  getSummariesByIds,
  resolveImages,
  summaryInclude,
  toPropertySummary,
  toSummaries,
} from "../services/property.service";
import type {
  CreatePropertyInput,
  UpdatePropertyInput,
} from "../validations/property.validation";
import { queryEnum, queryInt, queryNumber, queryString } from "../utils/query";
import { round1 } from "../utils/months";

const SORTS = ["newest", "oldest", "price_asc", "price_desc", "rating", "popular"] as const;
type Sort = (typeof SORTS)[number];

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

// GET /properties/categories — categories with count of AVAILABLE properties
export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { properties: { where: { isAvailable: true } } } },
      },
    });

    res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        propertyCount: c._count.properties,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// GET /properties — search, filter, sort, paginate (available listings only)
export const getProperties = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const q = req.query;
    const search = queryString(q["search"], 120);
    const location = queryString(q["location"], 120);
    const categoryId = queryString(q["categoryId"], 64);
    const categoryName = queryString(q["category"], 120);
    const minPrice = queryNumber(q["minPrice"], { min: 0 });
    const maxPrice = queryNumber(q["maxPrice"], { min: 0 });
    const bedrooms = queryNumber(q["bedrooms"], { min: 0, max: 50 });
    const minRating = queryNumber(q["minRating"], { min: 0, max: 5 });
    const sort: Sort = queryEnum(q["sort"], SORTS) ?? "newest";
    // Upper bound keeps skip within Prisma's integer range (page=1e300 -> 400 otherwise).
    const page = queryInt(q["page"], { min: 1, max: 100_000, fallback: 1 });
    const limit = queryInt(q["limit"], { min: 1, max: 48, fallback: 12, clamp: true });

    const where: Prisma.PropertyWhereInput = { isAvailable: true };
    const and: Prisma.PropertyWhereInput[] = [];

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (categoryName) {
      where.category = { name: { equals: categoryName, mode: "insensitive" } };
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      };
    }
    if (bedrooms !== undefined) {
      where.bedrooms = { gte: Math.floor(bedrooms) };
    }
    if (search) {
      and.push({
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
          { category: { name: { contains: search, mode: "insensitive" } } },
        ],
      });
    }
    if (and.length) where.AND = and;

    const needsInMemory =
      sort === "rating" || sort === "popular" || (minRating !== undefined && minRating > 0);

    let total: number;
    let data;

    if (!needsInMemory) {
      const orderBy: Prisma.PropertyOrderByWithRelationInput[] =
        sort === "oldest"
          ? [{ createdAt: "asc" }]
          : sort === "price_asc"
            ? [{ price: "asc" }, { createdAt: "desc" }]
            : sort === "price_desc"
              ? [{ price: "desc" }, { createdAt: "desc" }]
              : [{ createdAt: "desc" }];

      const [count, rows] = await Promise.all([
        prisma.property.count({ where }),
        prisma.property.findMany({
          where,
          include: summaryInclude,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);
      total = count;
      data = await toSummaries(rows);
    } else {
      // Rating / popularity ordering (and minRating filtering) are computed in
      // memory over the filtered set, then paginated.
      const candidates = await prisma.property.findMany({
        where,
        select: { id: true, price: true, createdAt: true },
      });
      const ids = candidates.map((c) => c.id);
      const ratings = await getRatingMap(ids);

      let popularity = new Map<string, number>();
      if (sort === "popular" && ids.length) {
        const groups = await prisma.rentalRequest.groupBy({
          by: ["propertyId"],
          where: { propertyId: { in: ids } },
          _count: { _all: true },
        });
        popularity = new Map(groups.map((g) => [g.propertyId, g._count._all]));
      }

      let list = candidates.map((c) => ({
        ...c,
        avg: ratings.get(c.id)?.avgRating ?? 0,
        reviews: ratings.get(c.id)?.reviewCount ?? 0,
        requests: popularity.get(c.id) ?? 0,
      }));

      if (minRating !== undefined && minRating > 0) {
        list = list.filter((p) => p.avg >= minRating);
      }

      const byNewest = (a: { createdAt: Date }, b: { createdAt: Date }) =>
        b.createdAt.getTime() - a.createdAt.getTime();

      list.sort((a, b) => {
        switch (sort) {
          case "rating":
            return b.avg - a.avg || b.reviews - a.reviews || byNewest(a, b);
          case "popular":
            return b.requests - a.requests || b.reviews - a.reviews || byNewest(a, b);
          case "oldest":
            return -byNewest(a, b);
          case "price_asc":
            return a.price - b.price || byNewest(a, b);
          case "price_desc":
            return b.price - a.price || byNewest(a, b);
          default:
            return byNewest(a, b);
        }
      });

      total = list.length;
      const pageIds = list.slice((page - 1) * limit, page * limit).map((p) => p.id);
      data = await getSummariesByIds(pageIds);
    }

    res.status(200).json({
      success: true,
      message: "Properties retrieved successfully",
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /properties/locations — available properties grouped by location
export const getLocations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const limit = queryInt(req.query["limit"], { min: 1, max: 50, fallback: 8, clamp: true });

    const groups = await prisma.property.groupBy({
      by: ["location"],
      where: { isAvailable: true },
      _count: { _all: true },
      orderBy: { _count: { location: "desc" } },
      take: limit,
    });

    const locations = groups.map((g) => g.location);
    const newest = locations.length
      ? await prisma.property.findMany({
          where: { isAvailable: true, location: { in: locations } },
          select: { location: true, imageUrl: true, images: true },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const imageByLocation = new Map<string, string>();
    for (const p of newest) {
      const img = p.imageUrl ?? p.images[0];
      if (img && !imageByLocation.has(p.location)) imageByLocation.set(p.location, img);
    }

    res.status(200).json({
      success: true,
      message: "Locations fetched successfully",
      data: groups.map((g) => ({
        location: g.location,
        count: g._count._all,
        imageUrl: imageByLocation.get(g.location) ?? null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// GET /properties/stats — public marketplace numbers
export const getPublicStats = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const [
      totalProperties,
      availableProperties,
      totalLandlords,
      totalTenants,
      cities,
      reviewAgg,
      successfulRentals,
    ] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { isAvailable: true } }),
      prisma.user.count({ where: { role: "LANDLORD" } }),
      prisma.user.count({ where: { role: "TENANT" } }),
      prisma.property.groupBy({ by: ["location"] }),
      prisma.review.aggregate({ _avg: { rating: true }, _count: { _all: true } }),
      prisma.rentalRequest.count({ where: { status: { in: ["ACTIVE", "COMPLETED"] } } }),
    ]);

    res.status(200).json({
      success: true,
      message: "Marketplace stats fetched successfully",
      data: {
        totalProperties,
        availableProperties,
        totalLandlords,
        totalTenants,
        // Locations are stored as "Area, City" — count distinct cities.
        totalCities: new Set(
          cities.map((c) => (c.location.split(",").pop() ?? c.location).trim().toLowerCase()),
        ).size,
        averageRating: reviewAgg._avg.rating ? round1(reviewAgg._avg.rating) : 0,
        totalReviews: reviewAgg._count._all,
        successfulRentals,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /properties/trending — most requested in the last 30 days, then newest
export const getTrendingProperties = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const limit = queryInt(req.query["limit"], { min: 1, max: 24, fallback: 8, clamp: true });
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const groups = await prisma.rentalRequest.groupBy({
      by: ["propertyId"],
      where: { createdAt: { gte: since }, property: { isAvailable: true } },
      _count: { propertyId: true },
      orderBy: { _count: { propertyId: "desc" } },
      take: limit,
    });

    const ids = groups.map((g) => g.propertyId);
    if (ids.length < limit) {
      const filler = await prisma.property.findMany({
        where: { isAvailable: true, id: { notIn: ids } },
        select: { id: true },
        orderBy: { createdAt: "desc" },
        take: limit - ids.length,
      });
      ids.push(...filler.map((f) => f.id));
    }

    const data = await getSummariesByIds(ids, { isAvailable: true });

    res.status(200).json({
      success: true,
      message: "Trending properties fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// GET /properties/:id — PropertyDetail (landlord email NOT exposed)
export const getPropertyById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params["id"] as string;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        landlord: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            _count: { select: { properties: true } },
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            tenant: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!property) {
      throw new AppError(404, "Property not found");
    }

    const reviewCount = property.reviews.length;
    const avgRating = reviewCount
      ? round1(property.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount)
      : 0;

    const summary = toPropertySummary(
      {
        ...property,
        landlord: { id: property.landlord.id, name: property.landlord.name },
      },
      { avgRating, reviewCount },
    );

    res.status(200).json({
      success: true,
      message: "Property details fetched successfully",
      data: {
        ...summary,
        landlord: {
          id: property.landlord.id,
          name: property.landlord.name,
          createdAt: property.landlord.createdAt,
          propertyCount: property.landlord._count.properties,
        },
        reviews: property.reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /properties/:id/related — same category or same location
export const getRelatedProperties = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params["id"] as string;
    const limit = queryInt(req.query["limit"], { min: 1, max: 12, fallback: 4, clamp: true });

    const property = await prisma.property.findUnique({
      where: { id },
      select: { id: true, categoryId: true, location: true },
    });
    if (!property) {
      throw new AppError(404, "Property not found");
    }

    const candidates = await prisma.property.findMany({
      where: {
        isAvailable: true,
        id: { not: property.id },
        OR: [{ categoryId: property.categoryId }, { location: property.location }],
      },
      select: { id: true, categoryId: true, location: true },
      orderBy: { createdAt: "desc" },
      take: limit * 4,
    });

    // Prefer listings matching both category and location.
    const score = (c: { categoryId: string; location: string }) =>
      (c.categoryId === property.categoryId ? 1 : 0) +
      (c.location === property.location ? 1 : 0);
    const ids = [...candidates]
      .sort((a, b) => score(b) - score(a))
      .slice(0, limit)
      .map((c) => c.id);

    const data = await getSummariesByIds(ids);

    res.status(200).json({
      success: true,
      message: "Related properties fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// LANDLORD / ADMIN ENDPOINTS (Protected)
// Shared by /properties/landlord/* and /landlord/properties/*
// ==========================================

const assertCategoryExists = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  if (!category) throw new AppError(400, "Selected category does not exist");
};

export const createProperty = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const landlordId = req.user!.id;
    const body = req.body as CreatePropertyInput;

    await assertCategoryExists(body.categoryId);

    const imageData = resolveImages({ images: body.images ?? [], imageUrl: body.imageUrl });

    const property = await prisma.property.create({
      data: {
        title: body.title,
        description: body.description,
        address: body.address,
        location: body.location,
        price: body.price,
        categoryId: body.categoryId,
        landlordId,
        images: imageData.images ?? [],
        imageUrl: imageData.imageUrl ?? null,
        bedrooms: body.bedrooms ?? null,
        bathrooms: body.bathrooms ?? null,
        areaSqft: body.areaSqft ?? null,
        amenities: Array.from(new Set(body.amenities ?? [])),
        ...(body.isAvailable !== undefined ? { isAvailable: body.isAvailable } : {}),
      },
      include: summaryInclude,
    });

    res.status(201).json({
      success: true,
      message: "Property listing created successfully",
      data: toPropertySummary(property, undefined),
    });
  } catch (error) {
    next(error);
  }
};

export const updateProperty = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params["id"] as string;
    const body = req.body as UpdatePropertyInput;

    const existing = await prisma.property.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError(404, "Property not found");
    }
    if (existing.landlordId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError(403, "You can only update your own property listings");
    }
    if (body.categoryId !== undefined) {
      await assertCategoryExists(body.categoryId);
    }

    const imageData = resolveImages({
      images: body.images,
      imageUrl: body.imageUrl,
      existingImages: existing.images,
    });

    const data: Prisma.PropertyUncheckedUpdateInput = {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.location !== undefined && { location: body.location }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
      ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
      ...(body.bedrooms !== undefined && { bedrooms: body.bedrooms }),
      ...(body.bathrooms !== undefined && { bathrooms: body.bathrooms }),
      ...(body.areaSqft !== undefined && { areaSqft: body.areaSqft }),
      ...(body.amenities !== undefined && { amenities: Array.from(new Set(body.amenities)) }),
      ...(imageData.images !== undefined && { images: imageData.images }),
      ...(imageData.imageUrl !== undefined && { imageUrl: imageData.imageUrl }),
    };

    const updated = await prisma.property.update({
      where: { id },
      data,
      include: summaryInclude,
    });

    const ratings = await getRatingMap([updated.id]);

    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      data: toPropertySummary(updated, ratings.get(updated.id)),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProperty = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params["id"] as string;

    const existing = await prisma.property.findUnique({
      where: { id },
      select: { landlordId: true },
    });

    if (!existing) {
      throw new AppError(404, "Property not found");
    }
    if (existing.landlordId !== req.user!.id && req.user!.role !== "ADMIN") {
      throw new AppError(403, "You can only delete your own property listings");
    }

    await assertPropertyDeletable(id);
    await prisma.property.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: "Property listing removed successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
