import { z } from "zod";
export const createPropertySchema = z.object({
    body: z.object({
        title: z
            .string()
            .min(3, { message: "Title must be at least 3 characters long" }),
        description: z
            .string()
            .min(10, { message: "Description must be at least 10 characters long" }),
        address: z.string().min(3, { message: "Address is required" }),
        location: z.string().min(2, { message: "Location is required" }),
        price: z.number().positive({ message: "Price must be a positive number" }),
        categoryId: z.string().uuid({ message: "Valid Category UUID is required" }),
    }),
});
export const updatePropertySchema = z.object({
    params: z.object({
        id: z
            .string()
            .uuid({ message: "Valid Property UUID parameter is required" }),
    }),
    body: z.object({
        title: z.string().min(3).optional(),
        description: z.string().min(10).optional(),
        address: z.string().min(3).optional(),
        location: z.string().min(2).optional(),
        price: z.number().positive().optional(),
        isAvailable: z.boolean().optional(),
        categoryId: z.string().uuid().optional(),
    }),
});
//# sourceMappingURL=property.validation.js.map