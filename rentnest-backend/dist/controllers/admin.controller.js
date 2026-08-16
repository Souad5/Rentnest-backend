import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/errorHandler";
import {} from "../middlewares/auth";
const prisma = new PrismaClient();
// ==========================================
// USER MANAGEMENT
// ==========================================
// 1. Get All Users (Admin)
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isBanned: true,
                createdAt: true,
                _count: {
                    select: {
                        properties: true,
                        rentalRequests: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({
            success: true,
            message: "All registered users fetched successfully",
            data: users,
        });
    }
    catch (error) {
        next(error);
    }
};
// 2. Ban / Unban User Status (Admin)
export const toggleUserBan = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { isBanned } = req.body;
        const currentAdminId = req.user.id;
        if (id === currentAdminId) {
            throw new AppError(400, "Admin cannot ban their own account");
        }
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new AppError(404, "User not found");
        }
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isBanned },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isBanned: true,
            },
        });
        res.status(200).json({
            success: true,
            message: `User status updated to ${isBanned ? "BANNED" : "ACTIVE"}`,
            data: updatedUser,
        });
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// SYSTEM PROPERTY MANAGEMENT
// ==========================================
// 3. Get All Properties Including Unavailable Listings (Admin)
export const getAllSystemProperties = async (req, res, next) => {
    try {
        const properties = await prisma.property.findMany({
            include: {
                category: true,
                landlord: {
                    select: { id: true, name: true, email: true },
                },
                _count: {
                    select: { rentalRequests: true, reviews: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({
            success: true,
            message: "All system properties retrieved successfully",
            data: properties,
        });
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// CATEGORY MANAGEMENT (CRUD)
// ==========================================
// 4. Create Category (Admin)
export const createCategory = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const existingCategory = await prisma.category.findUnique({
            where: { name },
        });
        if (existingCategory) {
            throw new AppError(400, "Category with this name already exists");
        }
        const category = await prisma.category.create({
            data: { name, description },
        });
        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });
    }
    catch (error) {
        next(error);
    }
};
// 5. Update Category (Admin)
export const updateCategory = async (req, res, next) => {
    try {
        const id = req.params.id;
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new AppError(404, "Category not found");
        }
        const updatedCategory = await prisma.category.update({
            where: { id },
            data: req.body,
        });
        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: updatedCategory,
        });
    }
    catch (error) {
        next(error);
    }
};
// 6. Delete Category (Admin)
export const deleteCategory = async (req, res, next) => {
    try {
        const id = req.params.id;
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { properties: true },
                },
            },
        });
        if (!category) {
            throw new AppError(404, "Category not found");
        }
        if (category._count.properties > 0) {
            throw new AppError(400, "Cannot delete category containing existing property listings");
        }
        await prisma.category.delete({ where: { id } });
        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
            data: null,
        });
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// SYSTEM RENTAL MANAGEMENT
// ==========================================
// 7. Get All System Rental Requests (Admin)
export const getAllSystemRentals = async (req, res, next) => {
    try {
        const rentals = await prisma.rentalRequest.findMany({
            include: {
                tenant: {
                    select: { id: true, name: true, email: true },
                },
                property: {
                    select: {
                        id: true,
                        title: true,
                        price: true,
                        landlord: {
                            select: { id: true, name: true, email: true },
                        },
                    },
                },
                payment: {
                    select: {
                        id: true,
                        amount: true,
                        status: true,
                        provider: true,
                        paidAt: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({
            success: true,
            message: "All system rental requests retrieved successfully",
            data: rentals,
        });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=admin.controller.js.map