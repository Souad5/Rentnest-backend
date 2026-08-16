import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    propertyId: z.string().uuid({ message: "Valid Property UUID is required" }),
    rating: z
      .number({ message: "Rating must be a number" })
      .min(1, { message: "Rating must be at least 1" })
      .max(5, { message: "Rating cannot exceed 5" }),
    comment: z
      .string()
      .min(5, { message: "Comment must be at least 5 characters long" }),
  }),
});
