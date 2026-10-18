import { z } from "zod";
import { httpUrl } from "./common";
const uuidParam = z.object({
    id: z.string().uuid({ message: "Valid Property UUID parameter is required" }),
});
const imageUrlField = httpUrl("Image URL must be a valid http(s) URL");
const images = z
    .array(imageUrlField)
    .max(10, { message: "A maximum of 10 images is allowed" });
const roomCount = z
    .number()
    .int({ message: "Must be a whole number" })
    .min(0)
    .max(50);
const areaSqft = z.number().int({ message: "Must be a whole number" }).min(1).max(100000);
const amenities = z
    .array(z.string().trim().min(1).max(60, { message: "Each amenity must be 60 characters or fewer" }))
    .max(20, { message: "A maximum of 20 amenities is allowed" });
export const createPropertySchema = z.object({
    body: z.object({
        title: z
            .string()
            .trim()
            .min(3, { message: "Title must be at least 3 characters long" })
            .max(150),
        description: z
            .string()
            .trim()
            .min(10, { message: "Description must be at least 10 characters long" })
            .max(5000),
        address: z.string().trim().min(3, { message: "Address is required" }).max(300),
        location: z.string().trim().min(2, { message: "Location is required" }).max(120),
        price: z.number().positive({ message: "Price must be a positive number" }).max(1_000_000),
        categoryId: z.string().uuid({ message: "Valid Category UUID is required" }),
        imageUrl: imageUrlField.nullable().optional(),
        images: images.optional(),
        bedrooms: roomCount.nullable().optional(),
        bathrooms: roomCount.nullable().optional(),
        areaSqft: areaSqft.nullable().optional(),
        amenities: amenities.optional(),
        isAvailable: z.boolean().optional(),
    }),
});
export const updatePropertySchema = z.object({
    params: uuidParam,
    body: z.object({
        title: z.string().trim().min(3).max(150).optional(),
        description: z.string().trim().min(10).max(5000).optional(),
        address: z.string().trim().min(3).max(300).optional(),
        location: z.string().trim().min(2).max(120).optional(),
        price: z.number().positive().max(1_000_000).optional(),
        isAvailable: z.boolean().optional(),
        categoryId: z.string().uuid().optional(),
        imageUrl: imageUrlField.nullable().optional(),
        images: images.optional(),
        bedrooms: roomCount.nullable().optional(),
        bathrooms: roomCount.nullable().optional(),
        areaSqft: areaSqft.nullable().optional(),
        amenities: amenities.optional(),
    }),
});
export const propertyIdParamSchema = z.object({ params: uuidParam });
//# sourceMappingURL=property.validation.js.map