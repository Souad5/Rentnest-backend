import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import { findOverlappingRental } from "../services/rental.service";
import { summaryInclude } from "../services/property.service";
import { buildMonthSeries, lastMonths, round2 } from "../utils/months";
const ALL_STATUSES = ["PENDING", "APPROVED", "REJECTED", "ACTIVE", "COMPLETED"];
// Users pick a calendar day in their own timezone; the browser may serialise
// local midnight as the previous UTC day (e.g. UTC+6 -> 18:00Z the day before).
// Allow up to 14h (the largest UTC offset) of slack before "today" in UTC.
const MAX_TZ_SLACK_MS = 14 * 60 * 60 * 1000;
const startOfUtcDay = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
// 1. Submit a Rental Request (Tenant)
export const createRentalRequest = async (req, res, next) => {
    try {
        const tenantId = req.user.id;
        const { propertyId } = req.body;
        const startDate = new Date(req.body.startDate);
        const endDate = new Date(req.body.endDate);
        if (startDate.getTime() < startOfUtcDay(new Date()).getTime() - MAX_TZ_SLACK_MS) {
            throw new AppError(400, "Start date cannot be in the past");
        }
        if (endDate <= startDate) {
            throw new AppError(400, "End date must be after start date");
        }
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
        });
        if (!property) {
            throw new AppError(404, "Property not found");
        }
        if (!property.isAvailable) {
            throw new AppError(400, "This property is currently not available for rent");
        }
        if (property.landlordId === tenantId) {
            throw new AppError(400, "You cannot submit a rental request for your own property");
        }
        const existingRequest = await prisma.rentalRequest.findFirst({
            where: { propertyId, tenantId, status: "PENDING" },
            select: { id: true },
        });
        if (existingRequest) {
            throw new AppError(400, "You already have a pending request for this property");
        }
        const overlap = await findOverlappingRental({ propertyId, startDate, endDate });
        if (overlap) {
            throw new AppError(409, "The property is already booked for some of these dates. Please choose different dates.");
        }
        const rentalRequest = await prisma.rentalRequest.create({
            data: {
                tenantId,
                propertyId,
                startDate,
                endDate,
                status: "PENDING",
            },
            include: {
                property: {
                    select: { id: true, title: true, address: true, location: true, price: true },
                },
            },
        });
        res.status(201).json({
            success: true,
            message: "Rental request submitted successfully",
            data: rentalRequest,
        });
    }
    catch (error) {
        next(error);
    }
};
// 2. Get Tenant's Own Rental Requests
export const getMyRentalRequests = async (req, res, next) => {
    try {
        const tenantId = req.user.id;
        const requests = await prisma.rentalRequest.findMany({
            where: { tenantId },
            include: {
                property: {
                    include: {
                        category: { select: { id: true, name: true } },
                        landlord: { select: { id: true, name: true, email: true } },
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
    }
    catch (error) {
        next(error);
    }
};
// 3. Tenant dashboard stats
export const getTenantStats = async (req, res, next) => {
    try {
        const tenantId = req.user.id;
        const months = lastMonths(6);
        const [statusGroups, payments, reviewsWritten] = await Promise.all([
            prisma.rentalRequest.groupBy({
                by: ["status"],
                where: { tenantId },
                _count: { _all: true },
            }),
            prisma.payment.findMany({
                where: { userId: tenantId, status: "COMPLETED" },
                select: { amount: true, paidAt: true },
            }),
            prisma.review.count({ where: { tenantId } }),
        ]);
        const counts = new Map(statusGroups.map((g) => [g.status, g._count._all]));
        const get = (s) => counts.get(s) ?? 0;
        res.status(200).json({
            success: true,
            message: "Tenant stats fetched successfully",
            data: {
                totalRequests: ALL_STATUSES.reduce((sum, s) => sum + get(s), 0),
                pending: get("PENDING"),
                approved: get("APPROVED"),
                active: get("ACTIVE"),
                rejected: get("REJECTED"),
                completed: get("COMPLETED"),
                totalSpent: round2(payments.reduce((sum, p) => sum + p.amount, 0)),
                reviewsWritten,
                monthlySpending: buildMonthSeries(months, {
                    amount: payments.map((p) => ({ date: p.paidAt, value: p.amount })),
                }),
                requestsByStatus: ALL_STATUSES.map((status) => ({ status, count: get(status) })),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
// 4. Get Rental Request By ID
export const getRentalRequestById = async (req, res, next) => {
    try {
        const id = req.params["id"];
        const userId = req.user.id;
        const userRole = req.user.role;
        const rentalRequest = await prisma.rentalRequest.findUnique({
            where: { id },
            include: {
                property: {
                    include: {
                        ...summaryInclude,
                        landlord: { select: { id: true, name: true, email: true } },
                    },
                },
                tenant: { select: { id: true, name: true, email: true } },
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
            throw new AppError(403, "You do not have permission to view this rental request");
        }
        res.status(200).json({
            success: true,
            message: "Rental request retrieved successfully",
            data: rentalRequest,
        });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=rental.controller.js.map