import { PrismaClient } from "@prisma/client";
import { AppError } from "../middlewares/errorHandler";
import {} from "../middlewares/auth";
const prisma = new PrismaClient();
// ==========================================
// LANDLORD PROPERTY MANAGEMENT
// ==========================================
// 1. Create Property Listing
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
// 2. Update Property Listing
export const updateProperty = async (req, res, next) => {
    try {
        const id = req.params.id;
        const landlordId = req.user.id;
        const isAdmin = req.user.role === "ADMIN";
        const property = await prisma.property.findUnique({ where: { id } });
        if (!property) {
            throw new AppError(404, "Property not found");
        }
        if (property.landlordId !== landlordId && !isAdmin) {
            throw new AppError(403, "You can only update your own property listings");
        }
        const updatedProperty = await prisma.property.update({
            where: { id },
            data: req.body,
        });
        res.status(200).json({
            success: true,
            message: "Property listing updated successfully",
            data: updatedProperty,
        });
    }
    catch (error) {
        next(error);
    }
};
// 3. Remove Property Listing
export const deleteProperty = async (req, res, next) => {
    try {
        const id = req.params.id;
        const landlordId = req.user.id;
        const isAdmin = req.user.role === "ADMIN";
        const property = await prisma.property.findUnique({ where: { id } });
        if (!property) {
            throw new AppError(404, "Property not found");
        }
        if (property.landlordId !== landlordId && !isAdmin) {
            throw new AppError(403, "You can only delete your own property listings");
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
// ==========================================
// LANDLORD REQUEST MANAGEMENT
// ==========================================
// 4. Get Landlord Received Requests
export const getLandlordRequests = async (req, res, next) => {
    try {
        const landlordId = req.user.id;
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
    }
    catch (error) {
        next(error);
    }
};
// 5. Update Request Status (Approve / Reject)
export const updateRequestStatus = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const userId = req.user.id;
        const validStatuses = ["APPROVED", "REJECTED"];
        if (!status || !validStatuses.includes(status)) {
            throw new AppError(400, "Invalid status. Landlords can only set status to APPROVED or REJECTED.");
        }
        const rentalRequest = await prisma.rentalRequest.findUnique({
            where: { id },
            include: { property: true },
        });
        if (!rentalRequest) {
            throw new AppError(404, "Rental request not found");
        }
        const isLandlord = rentalRequest.property.landlordId === userId;
        const isAdmin = req.user.role === "ADMIN";
        if (!isLandlord && !isAdmin) {
            throw new AppError(403, "Only the property landlord or an admin can approve or reject requests");
        }
        const updatedRequest = await prisma.rentalRequest.update({
            where: { id },
            data: { status },
            include: {
                tenant: { select: { id: true, name: true, email: true } },
                property: { select: { id: true, title: true, price: true } },
            },
        });
        res.status(200).json({
            success: true,
            message: `Rental request ${status.toLowerCase()} successfully`,
            data: updatedRequest,
        });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=landlord.controller.js.map