import { z } from "zod";
export const createReviewSchema = z.object({
    body: z.object({
        propertyId: z.string().uuid({ message: "Valid Property UUID is required" }),
        rating: z
            .number({ message: "Rating must be a number" })
            .int({ message: "Rating must be a whole number" })
            .min(1, { message: "Rating must be at least 1" })
            .max(5, { message: "Rating cannot exceed 5" }),
        comment: z
            .string()
            .trim()
            .min(5, { message: "Comment must be at least 5 characters long" })
            .max(2000, { message: "Comment must be 2000 characters or fewer" }),
    }),
});
//# sourceMappingURL=review.validation.js.map