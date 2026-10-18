import { z } from "zod";
export declare const searchSuggestionsSchema: z.ZodObject<{
    body: z.ZodObject<{
        query: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const chatSchema: z.ZodObject<{
    body: z.ZodObject<{
        messages: z.ZodArray<z.ZodObject<{
            role: z.ZodEnum<{
                assistant: "assistant";
                user: "user";
            }>;
            content: z.ZodString;
        }, z.core.$strip>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const propertyDescriptionSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        location: z.ZodString;
        address: z.ZodOptional<z.ZodString>;
        category: z.ZodOptional<z.ZodString>;
        bedrooms: z.ZodOptional<z.ZodNumber>;
        bathrooms: z.ZodOptional<z.ZodNumber>;
        areaSqft: z.ZodOptional<z.ZodNumber>;
        amenities: z.ZodOptional<z.ZodArray<z.ZodString>>;
        price: z.ZodOptional<z.ZodNumber>;
        notes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ChatInput = z.infer<typeof chatSchema>["body"];
export type PropertyDescriptionInput = z.infer<typeof propertyDescriptionSchema>["body"];
//# sourceMappingURL=ai.validation.d.ts.map