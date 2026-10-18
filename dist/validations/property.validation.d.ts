import { z } from "zod";
export declare const createPropertySchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        address: z.ZodString;
        location: z.ZodString;
        price: z.ZodNumber;
        categoryId: z.ZodString;
        imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        images: z.ZodOptional<z.ZodArray<z.ZodString>>;
        bedrooms: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        bathrooms: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        areaSqft: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        amenities: z.ZodOptional<z.ZodArray<z.ZodString>>;
        isAvailable: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updatePropertySchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
        location: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodNumber>;
        isAvailable: z.ZodOptional<z.ZodBoolean>;
        categoryId: z.ZodOptional<z.ZodString>;
        imageUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        images: z.ZodOptional<z.ZodArray<z.ZodString>>;
        bedrooms: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        bathrooms: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        areaSqft: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        amenities: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const propertyIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>["body"];
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>["body"];
//# sourceMappingURL=property.validation.d.ts.map