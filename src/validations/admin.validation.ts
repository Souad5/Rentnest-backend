import { z } from "zod";

const idParam = (label: string) =>
  z.object({
    id: z.string().uuid({ message: `Valid ${label} UUID is required` }),
  });

export const banUserSchema = z.object({
  params: idParam("User"),
  body: z.object({
    isBanned: z.boolean({ message: "isBanned boolean field is required" }),
  }),
});

export const categorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Category name must be at least 2 characters long" })
      .max(60, { message: "Category name must be 60 characters or fewer" }),
    description: z.string().trim().max(500).nullable().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: idParam("Category"),
  body: z.object({
    name: z.string().trim().min(2).max(60).optional(),
    description: z.string().trim().max(500).nullable().optional(),
  }),
});

export const propertyAvailabilitySchema = z.object({
  params: idParam("Property"),
  body: z.object({
    isAvailable: z.boolean({ message: "isAvailable boolean field is required" }),
  }),
});

export const messageReadSchema = z.object({
  params: idParam("Message"),
  body: z.object({
    isRead: z.boolean({ message: "isRead boolean field is required" }),
  }),
});

export const userIdParamSchema = z.object({ params: idParam("User") });
export const propertyIdParamSchema = z.object({ params: idParam("Property") });
export const categoryIdParamSchema = z.object({ params: idParam("Category") });
export const reviewIdParamSchema = z.object({ params: idParam("Review") });
export const messageIdParamSchema = z.object({ params: idParam("Message") });
