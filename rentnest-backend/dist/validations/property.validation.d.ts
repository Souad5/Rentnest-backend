import { z } from "zod";
export declare const createPropertySchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodString;
        address: z.ZodString;
        location: z.ZodString;
        price: z.ZodNumber;
        categoryId: z.ZodString;
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
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=property.validation.d.ts.map