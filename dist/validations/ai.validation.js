import { z } from "zod";
export const searchSuggestionsSchema = z.object({
    body: z.object({
        query: z
            .string()
            .trim()
            .min(1, { message: "Query is required" })
            .max(120, { message: "Query must be 120 characters or fewer" }),
    }),
});
export const chatSchema = z.object({
    body: z.object({
        messages: z
            .array(z.object({
            role: z.enum(["user", "assistant"]),
            content: z
                .string()
                .trim()
                .min(1, { message: "Message cannot be empty" })
                .max(2000, { message: "Each message must be 2000 characters or fewer" }),
        }))
            .min(1, { message: "At least one message is required" })
            .max(20, { message: "A maximum of 20 messages is allowed" })
            .refine((msgs) => msgs[msgs.length - 1]?.role === "user", {
            message: "The last message must be from the user",
        }),
    }),
});
export const propertyDescriptionSchema = z.object({
    body: z.object({
        title: z.string().trim().min(3, { message: "Title is required" }).max(150),
        location: z.string().trim().min(2, { message: "Location is required" }).max(120),
        address: z.string().trim().max(300).optional(),
        category: z.string().trim().max(60).optional(),
        bedrooms: z.number().int().min(0).max(50).optional(),
        bathrooms: z.number().int().min(0).max(50).optional(),
        areaSqft: z.number().int().min(1).max(100000).optional(),
        amenities: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
        price: z.number().positive().max(1_000_000).optional(),
        notes: z.string().trim().max(1000).optional(),
    }),
});
//# sourceMappingURL=ai.validation.js.map