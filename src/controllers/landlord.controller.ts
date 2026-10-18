import type { Response, NextFunction } from "express";
import type { RequestStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import type { AuthRequest } from "../middlewares/auth";
import { summaryInclude, toSummaries } from "../services/property.service";
import { buildMonthSeries, lastMonths, round1, round2 } from "../utils/months";
import { findOverlappingRental } from "../services/rental.service";

const ALL_STATUSES: RequestStatus[] = ["PENDING", "APPROVED", "REJECTED", "ACTIVE", "COMPLETED"];

// ==========================================
// LANDLORD PROPERTY MANAGEMENT
// Create / update / delete live in property.controller and are shared by
// /properties/landlord/* and /landlord/properties/*.
// ==========================================

// GET /landlord/properties — the landlord's own listings (all availability states)
export const getMyProperties = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const landlordId = req.user!.id;

    const properties = await prisma.property.findMany({
      where: { landlordId },
      include: {
        ...summaryInclude,
        _count: { select: { rentalRequests: true, reviews: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const summaries = await toSummaries(properties);
    const data = summaries.map((s, i) => ({
      ...s,
      _count: properties[i]?._count ?? { rentalRequests: 0, reviews: 0 },
    }));

    res.status(200).json({
      success: true,
      message: "Landlord properties fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// LANDLORD REQUEST MANAGEMENT
// ==========================================

// GET /landlord/requests
export const getLandlordRequests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const landlordId = req.user!.id;

    const requests = await prisma.rentalRequest.findMany({
      where: { property: { landlordId } },
      include: {
        tenant: { select: { id: true, name: true, email: true } },
        property: { include: summaryInclude },
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

// PATCH /landlord/requests/:id — approve / reject a PENDING request
export const updateRequestStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params["id"] as string;
    const { status } = req.body as { status: "APPROVED" | "REJECTED" };
    const userId = req.user!.id;

    const rentalRequest = await prisma.rentalRequest.findUnique({
      where: { id },
      include: { property: { select: { landlordId: true } } },
    });

    if (!rentalRequest) {
      throw new AppError(404, "Rental request not found");
    }

    const isLandlord = rentalRequest.property.landlordId === userId;
    const isAdmin = req.user!.role === "ADMIN";
    if (!isLandlord && !isAdmin) {
      throw new AppError(
        403,
        "Only the property landlord or an admin can approve or reject requests",
      );
    }

    if (rentalRequest.status !== "PENDING") {
      throw new AppError(
        400,
        `Only pending requests can be ${status === "APPROVED" ? "approved" : "rejected"}. This request is ${rentalRequest.status.toLowerCase()}.`,
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      if (status === "APPROVED") {
        // Lock the property row so concurrent approvals of two overlapping
        // requests are serialised (otherwise both pass the overlap check).
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${rentalRequest.propertyId} FOR UPDATE`;

        const overlap = await findOverlappingRental(
          {
            propertyId: rentalRequest.propertyId,
            startDate: rentalRequest.startDate,
            endDate: rentalRequest.endDate,
            excludeId: rentalRequest.id,
          },
          tx,
        );
        if (overlap) {
          throw new AppError(
            409,
            "These dates overlap with another approved or active rental for this property",
          );
        }
      }

      // Conditional update guards against two concurrent approvals of the same request.
      return tx.rentalRequest.updateMany({
        where: { id, status: "PENDING" },
        data: { status },
      });
    });
    if (result.count === 0) {
      throw new AppError(409, "This request was updated by someone else. Please refresh.");
    }

    const updatedRequest = await prisma.rentalRequest.findUnique({
      where: { id },
      include: {
        tenant: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, title: true, price: true } },
        payment: true,
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

// ==========================================
// LANDLORD DASHBOARD
// ==========================================

// GET /landlord/stats
export const getLandlordStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const landlordId = req.user!.id;
    const months = lastMonths(6);
    const windowStart = months[0]!.start;

    const [properties, statusGroups, reviewAgg, completedPayments, requestGroups] =
      await Promise.all([
        prisma.property.findMany({
          where: { landlordId },
          select: { id: true, title: true, isAvailable: true },
        }),
        prisma.rentalRequest.groupBy({
          by: ["status"],
          where: { property: { landlordId } },
          _count: { _all: true },
        }),
        prisma.review.aggregate({
          where: { property: { landlordId } },
          _avg: { rating: true },
          _count: { _all: true },
        }),
        prisma.payment.findMany({
          where: { status: "COMPLETED", rentalRequest: { property: { landlordId } } },
          select: {
            amount: true,
            paidAt: true,
            rentalRequest: { select: { propertyId: true } },
          },
        }),
        prisma.rentalRequest.groupBy({
          by: ["propertyId"],
          where: { property: { landlordId } },
          _count: { _all: true },
        }),
      ]);

    const statusCount = new Map(statusGroups.map((g) => [g.status, g._count._all]));
    const requestsByStatus = ALL_STATUSES.map((status) => ({
      status,
      count: statusCount.get(status) ?? 0,
    }));

    const totalEarnings = round2(completedPayments.reduce((sum, p) => sum + p.amount, 0));

    const monthlyEarnings = buildMonthSeries(months, {
      earnings: completedPayments
        .filter((p) => p.paidAt && p.paidAt >= windowStart)
        .map((p) => ({ date: p.paidAt, value: p.amount })),
    });

    const earningsByProperty = new Map<string, number>();
    for (const p of completedPayments) {
      const pid = p.rentalRequest.propertyId;
      earningsByProperty.set(pid, (earningsByProperty.get(pid) ?? 0) + p.amount);
    }
    const requestsByProperty = new Map(requestGroups.map((g) => [g.propertyId, g._count._all]));

    const topProperties = properties
      .map((p) => ({
        id: p.id,
        title: p.title,
        requests: requestsByProperty.get(p.id) ?? 0,
        earnings: round2(earningsByProperty.get(p.id) ?? 0),
      }))
      .sort((a, b) => b.earnings - a.earnings || b.requests - a.requests)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      message: "Landlord stats fetched successfully",
      data: {
        totalProperties: properties.length,
        availableProperties: properties.filter((p) => p.isAvailable).length,
        pendingRequests: statusCount.get("PENDING") ?? 0,
        activeRentals: statusCount.get("ACTIVE") ?? 0,
        totalEarnings,
        averageRating: reviewAgg._avg.rating ? round1(reviewAgg._avg.rating) : 0,
        totalReviews: reviewAgg._count._all,
        monthlyEarnings,
        requestsByStatus,
        topProperties,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /landlord/payments — payments for the landlord's properties
export const getLandlordPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const landlordId = req.user!.id;

    const payments = await prisma.payment.findMany({
      where: { rentalRequest: { property: { landlordId } } },
      include: {
        rentalRequest: {
          include: {
            property: { select: { id: true, title: true } },
            tenant: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      success: true,
      message: "Landlord payments fetched successfully",
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};
