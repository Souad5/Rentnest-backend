import { assertPropertyDeletable } from "../services/rental.service";
import { prisma } from "../lib/prisma";
import { AppError } from "../middlewares/errorHandler";
import { getAdminStats } from "../services/stats.service";
import { getRatingMap, summaryInclude, toPropertySummary } from "../services/property.service";
import { publicUserSelect } from "./auth.controller";
const ok = (res, message, data, status = 200) => res.status(status).json({ success: true, message, data });
const idParam = (req) => req.params["id"];
// ==========================================
// DASHBOARD
// ==========================================
export const getStats = async (_req, res, next) => {
    try {
        ok(res, "Admin stats fetched successfully", await getAdminStats());
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// USER MANAGEMENT
// ==========================================
export const getAllUsers = async (_req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                ...publicUserSelect,
                _count: { select: { properties: true, rentalRequests: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        ok(res, "All registered users fetched successfully", users);
    }
    catch (error) {
        next(error);
    }
};
export const toggleUserBan = async (req, res, next) => {
    try {
        const id = idParam(req);
        const { isBanned } = req.body;
        if (id === req.user.id) {
            throw new AppError(400, "Admin cannot ban their own account");
        }
        const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
        if (!user) {
            throw new AppError(404, "User not found");
        }
        if (user.role === "ADMIN" && isBanned) {
            throw new AppError(403, "Administrators cannot be banned");
        }
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isBanned },
            select: publicUserSelect,
        });
        ok(res, `User status updated to ${isBanned ? "BANNED" : "ACTIVE"}`, updatedUser);
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// PROPERTY MODERATION
// ==========================================
export const getAllSystemProperties = async (_req, res, next) => {
    try {
        const properties = await prisma.property.findMany({
            include: {
                category: { select: { id: true, name: true } },
                landlord: { select: { id: true, name: true, email: true } },
                _count: { select: { rentalRequests: true, reviews: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        const ratings = await getRatingMap(properties.map((p) => p.id));
        const data = properties.map((p) => ({
            ...toPropertySummary(p, ratings.get(p.id)),
            landlord: p.landlord, // admins may see landlord email
            _count: p._count,
        }));
        ok(res, "All system properties retrieved successfully", data);
    }
    catch (error) {
        next(error);
    }
};
export const setPropertyAvailability = async (req, res, next) => {
    try {
        const { isAvailable } = req.body;
        const property = await prisma.property.update({
            where: { id: idParam(req) },
            data: { isAvailable },
            include: summaryInclude,
        });
        const ratings = await getRatingMap([property.id]);
        ok(res, `Property ${isAvailable ? "published" : "hidden"} successfully`, toPropertySummary(property, ratings.get(property.id)));
    }
    catch (error) {
        next(error);
    }
};
export const deleteSystemProperty = async (req, res, next) => {
    try {
        await assertPropertyDeletable(idParam(req));
        await prisma.property.delete({ where: { id: idParam(req) } });
        ok(res, "Property removed successfully", null);
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// RENTALS & PAYMENTS
// ==========================================
export const getAllSystemRentals = async (_req, res, next) => {
    try {
        const rentals = await prisma.rentalRequest.findMany({
            include: {
                tenant: { select: { id: true, name: true, email: true } },
                property: {
                    select: {
                        id: true,
                        title: true,
                        location: true,
                        price: true,
                        imageUrl: true,
                        landlord: { select: { id: true, name: true, email: true } },
                    },
                },
                payment: {
                    select: {
                        id: true,
                        amount: true,
                        status: true,
                        provider: true,
                        transactionId: true,
                        paidAt: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        ok(res, "All system rental requests retrieved successfully", rentals);
    }
    catch (error) {
        next(error);
    }
};
export const getAllPayments = async (_req, res, next) => {
    try {
        const payments = await prisma.payment.findMany({
            include: {
                user: { select: { id: true, name: true, email: true } },
                rentalRequest: {
                    include: {
                        property: { select: { id: true, title: true } },
                        tenant: { select: { id: true, name: true, email: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        ok(res, "All payments retrieved successfully", payments);
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// CATEGORY MANAGEMENT (CRUD)
// ==========================================
export const getAllCategories = async (_req, res, next) => {
    try {
        const categories = await prisma.category.findMany({
            include: { _count: { select: { properties: true } } },
            orderBy: { name: "asc" },
        });
        ok(res, "Categories fetched successfully", categories.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            propertyCount: c._count.properties,
        })));
    }
    catch (error) {
        next(error);
    }
};
export const createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const existing = await prisma.category.findFirst({
            where: { name: { equals: name, mode: "insensitive" } },
            select: { id: true },
        });
        if (existing) {
            throw new AppError(409, "Category with this name already exists");
        }
        const category = await prisma.category.create({
            data: { name, description: description ? description : null },
        });
        ok(res, "Category created successfully", { ...category, propertyCount: 0 }, 201);
    }
    catch (error) {
        next(error);
    }
};
export const updateCategory = async (req, res, next) => {
    try {
        const id = idParam(req);
        const { name, description } = req.body;
        const category = await prisma.category.findUnique({ where: { id }, select: { id: true } });
        if (!category) {
            throw new AppError(404, "Category not found");
        }
        if (name !== undefined) {
            const clash = await prisma.category.findFirst({
                where: { name: { equals: name, mode: "insensitive" }, id: { not: id } },
                select: { id: true },
            });
            if (clash)
                throw new AppError(409, "Category with this name already exists");
        }
        const updated = await prisma.category.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description: description ? description : null }),
            },
            include: { _count: { select: { properties: true } } },
        });
        ok(res, "Category updated successfully", {
            id: updated.id,
            name: updated.name,
            description: updated.description,
            propertyCount: updated._count.properties,
        });
    }
    catch (error) {
        next(error);
    }
};
export const deleteCategory = async (req, res, next) => {
    try {
        const id = idParam(req);
        const category = await prisma.category.findUnique({
            where: { id },
            include: { _count: { select: { properties: true } } },
        });
        if (!category) {
            throw new AppError(404, "Category not found");
        }
        if (category._count.properties > 0) {
            throw new AppError(400, "Cannot delete category containing existing property listings");
        }
        await prisma.category.delete({ where: { id } });
        ok(res, "Category deleted successfully", null);
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// REVIEWS
// ==========================================
export const getAllReviews = async (_req, res, next) => {
    try {
        const reviews = await prisma.review.findMany({
            select: {
                id: true,
                rating: true,
                comment: true,
                createdAt: true,
                tenant: { select: { id: true, name: true, email: true } },
                property: { select: { id: true, title: true, location: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        ok(res, "All reviews fetched successfully", reviews);
    }
    catch (error) {
        next(error);
    }
};
export const deleteReview = async (req, res, next) => {
    try {
        await prisma.review.delete({ where: { id: idParam(req) } });
        ok(res, "Review deleted successfully", null);
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// CONTACT MESSAGES & SUBSCRIBERS
// ==========================================
export const getMessages = async (_req, res, next) => {
    try {
        const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
        ok(res, "Messages fetched successfully", messages);
    }
    catch (error) {
        next(error);
    }
};
export const setMessageRead = async (req, res, next) => {
    try {
        const { isRead } = req.body;
        const message = await prisma.contactMessage.update({
            where: { id: idParam(req) },
            data: { isRead },
        });
        ok(res, `Message marked as ${isRead ? "read" : "unread"}`, message);
    }
    catch (error) {
        next(error);
    }
};
export const deleteMessage = async (req, res, next) => {
    try {
        await prisma.contactMessage.delete({ where: { id: idParam(req) } });
        ok(res, "Message deleted successfully", null);
    }
    catch (error) {
        next(error);
    }
};
export const getSubscribers = async (_req, res, next) => {
    try {
        const subscribers = await prisma.newsletterSubscriber.findMany({
            orderBy: { createdAt: "desc" },
        });
        ok(res, "Subscribers fetched successfully", subscribers);
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=admin.controller.js.map