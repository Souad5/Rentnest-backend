import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/errorHandler";
import {} from "../middlewares/auth";
const prisma = new PrismaClient();
// ==========================================
// PUBLIC ENDPOINTS
// ==========================================
// 1. Get all property categories
export const getCategories = async (req, res, next) => {
    try {
        const categories = await prisma.category.findMany();
        res.status(200).json({
            success: true,
            message: "Categories fetched successfully",
            data: categories,
        });
    }
    catch (error) {
        next(error);
    }
};
// 2. Search & filter properties (Public)
export const getProperties = async (req, res, next) => {
    try {
        const { location, minPrice, maxPrice, categoryId, search } = req.query;
        const where = { isAvailable: true };
        if (location) {
            where.location = { contains: String(location), mode: "insensitive" };
        }
        if (categoryId) {
            where.categoryId = String(categoryId);
        }
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice)
                where.price.gte = Number(minPrice);
            if (maxPrice)
                where.price.lte = Number(maxPrice);
        }
        if (search) {
            where.OR = [
                { title: { contains: String(search), mode: "insensitive" } },
                { description: { contains: String(search), mode: "insensitive" } },
                { address: { contains: String(search), mode: "insensitive" } },
            ];
        }
        const properties = await prisma.property.findMany({
            where,
            include: {
                category: true,
                landlord: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({
            success: true,
            message: "Properties retrieved successfully",
            data: properties,
        });
    }
    catch (error) {
        next(error);
    }
};
// 3. Get Single Property Details (Public)
export const getPropertyById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const property = await prisma.property.findUnique({
            where: { id },
            include: {
                category: true,
                landlord: {
                    select: { id: true, name: true, email: true },
                },
                reviews: {
                    include: {
                        tenant: { select: { id: true, name: true } },
                    },
                },
            },
        });
        if (!property) {
            throw new AppError(404, "Property not found");
        }
        res.status(200).json({
            success: true,
            message: "Property details fetched successfully",
            data: property,
        });
    }
    catch (error) {
        next(error);
    }
};
// ==========================================
// LANDLORD ENDPOINTS (Protected)
// ==========================================
// 4. Create Property Listing
export const createProperty = async (req, res, next) => {
    try {
        const landlordId = req.user.id;
        const { title, description, address, location, price, categoryId } = req.body;
        const property = await prisma.property.create({
            data: {
                title,
                description,
                address,
                location,
                price,
                categoryId,
                landlordId,
            },
            include: { category: true },
        });
        res.status(201).json({
            success: true,
            message: "Property listing created successfully",
            data: property,
        });
    }
    catch (error) {
        next(error);
    }
};
// 5. Update Property Listing
export const updateProperty = async (req, res, next) => {
    try {
        const id = req.params.id;
        const landlordId = req.user.id;
        const existingProperty = await prisma.property.findUnique({
            where: { id },
        });
        if (!existingProperty) {
            throw new AppError(404, "Property not found");
        }
        if (existingProperty.landlordId !== landlordId &&
            req.user.role !== "ADMIN") {
            throw new AppError(403, "Unauthorized to modify this property listing");
        }
        const updatedProperty = await prisma.property.update({
            where: { id },
            data: req.body,
        });
        res.status(200).json({
            success: true,
            message: "Property updated successfully",
            data: updatedProperty,
        });
    }
    catch (error) {
        next(error);
    }
};
// 6. Delete Property Listing
export const deleteProperty = async (req, res, next) => {
    try {
        const id = req.params.id;
        const landlordId = req.user.id;
        const existingProperty = await prisma.property.findUnique({
            where: { id },
        });
        if (!existingProperty) {
            throw new AppError(404, "Property not found");
        }
        if (existingProperty.landlordId !== landlordId &&
            req.user.role !== "ADMIN") {
            throw new AppError(403, "Unauthorized to delete this property listing");
        }
        await prisma.property.delete({ where: { id } });
        res.status(200).json({
            success: true,
            message: "Property listing removed successfully",
            data: null,
        });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=property.controller.js.map