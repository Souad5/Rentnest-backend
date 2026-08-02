import { z } from "zod";

export const banUserSchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Valid User UUID is required" }),
  }),
  body: z.object({
    isBanned: z.boolean({
      message: "isBanned boolean field is required",
    }),
  }),
});

export const categorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, { message: "Category name must be at least 2 characters long" }),
    description: z.string().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid({ message: "Valid Category UUID is required" }),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
});
