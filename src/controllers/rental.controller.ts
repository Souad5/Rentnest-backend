import type { Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/errorHandler";
import { type AuthRequest } from "../middlewares/auth";

const prisma = new PrismaClient();

// ==========================================
// TENANT ENDPOINTS
// ==========================================

// 1. Submit a Rental Request (Tenant)
export const createRentalRequest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenantId = req.user!.id;
    const { propertyId, startDate, endDate, specialNotes } = req.body;

    // Check if property exists and is available
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

    // Prevent Landlords from renting their own property
    if (property.landlordId === tenantId) {
      throw new AppError(
        400,
        "You cannot submit a rental request for your own property",
      );
    }

    // Check if tenant already has a pending request for this property
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

    // Create rental request
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

// 2. Get Tenant's Own Rental Requests (My Requests)
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

// ==========================================
// LANDLORD ENDPOINTS
// ==========================================

// 3. Get Landlord's Received Requests (Requests for Landlord's Properties)
export const getLandlordRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const landlordId = req.user!.id;

    const requests = await prisma.rentalRequest.findMany({
      where: {
        property: { landlordId },
      },
      include: {
        tenant: {
          select: { id: true, name: true, email: true },
        },
        property: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Landlord requests fetched successfully",
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update Request Status (Approve / Reject) (Landlord)
export const updateRequestStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!rentalRequest) {
      throw new AppError(404, "Rental request not found");
    }

    // Authorization: Landlord of the property OR Admin OR Tenant cancelling their own request
    const isLandlord = rentalRequest.property.landlordId === userId;
    const isTenant = rentalRequest.tenantId === userId;
    const isAdmin = req.user!.role === "ADMIN";

    if (status === "CANCELLED" && !isTenant && !isAdmin) {
      throw new AppError(
        403,
        "Only the tenant who created this request can cancel it",
      );
    }

    if (
      (status === "APPROVED" || status === "REJECTED") &&
      !isLandlord &&
      !isAdmin
    ) {
      throw new AppError(
        403,
        "Only the property landlord can approve or reject requests",
      );
    }

    const updatedRequest = await prisma.rentalRequest.update({
      where: { id },
      data: { status },
      include: {
        tenant: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, title: true } },
      },
    });

    res.status(200).json({
      success: true,
      message: `Rental request ${status.toLowerCase()} successfully`,
      data: updatedRequest,
    });
  } catch (error) {
    next(error);
  }
};
