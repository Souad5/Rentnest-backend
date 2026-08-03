import type { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/errorHandler";
import { type AuthRequest } from "../middlewares/auth";

const prisma = new PrismaClient();

// 1. Submit a Rental Request (Tenant)
export const createRentalRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, startDate, endDate, specialNotes } = req.body;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new AppError(404, "Property not found");
    }

    if (!property.isAvailable) {
      throw new AppError(
        400,
        "This property is currently not available for rent",
      );
    }

    if (property.landlordId === tenantId) {
      throw new AppError(
        400,
        "You cannot submit a rental request for your own property",
      );
    }

    const existingRequest = await prisma.rentalRequest.findFirst({
      where: {
        propertyId,
        tenantId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      throw new AppError(
        400,
        "You already have a pending request for this property",
      );
    }

    const rentalRequest = await prisma.rentalRequest.create({
      data: {
        tenantId,
        propertyId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        specialNotes,
        status: "PENDING",
      },
      include: {
        property: {
          select: { title: true, address: true, price: true },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Rental request submitted successfully",
      data: rentalRequest,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get Tenant's Own Rental Requests
export const getMyRentalRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.id;

    const requests = await prisma.rentalRequest.findMany({
      where: { tenantId },
      include: {
        property: {
          include: {
            landlord: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Rental requests fetched successfully",
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Rental Request By ID
export const getRentalRequestById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            landlord: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        tenant: {
          select: { id: true, name: true, email: true },
        },
        payment: true,
      },
    });

    if (!rentalRequest) {
      throw new AppError(404, "Rental request not found");
    }

    const isTenant = rentalRequest.tenantId === userId;
    const isLandlord = rentalRequest.property.landlordId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isTenant && !isLandlord && !isAdmin) {
      throw new AppError(
        403,
        "You do not have permission to view this rental request",
      );
    }

    res.status(200).json({
      success: true,
      message: "Rental request retrieved successfully",
      data: rentalRequest,
    });
  } catch (error) {
    next(error);
  }
};
