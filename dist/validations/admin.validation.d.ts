import { z } from "zod";
export declare const banUserSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        isBanned: z.ZodBoolean;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const categorySchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateCategorySchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const propertyAvailabilitySchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        isAvailable: z.ZodBoolean;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const messageReadSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        isRead: z.ZodBoolean;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const userIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const propertyIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const categoryIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const reviewIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const messageIdParamSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=admin.validation.d.ts.map