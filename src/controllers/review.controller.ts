import type { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/errorHandler";
import { type AuthRequest } from "../middlewares/auth";

const prisma = new PrismaClient();

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

    // Verify tenant has an approved or completed rental request for this property
    const validRental = await prisma.rentalRequest.findFirst({
      where: {
        propertyId,
        tenantId,
        status: "APPROVED",
      },
    });

    if (!validRental) {
      throw new AppError(
        403,
        "You can only review properties that you have an approved rental request for",
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
      include: {
        tenant: {
          select: { id: true, name: true },
        },
      },
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
      include: {
        tenant: {
          select: { id: true, name: true },
        },
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
