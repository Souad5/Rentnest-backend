import { z } from "zod";
import { httpUrl } from "./common";

const passwordPolicy = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .max(128, { message: "Password must be 128 characters or fewer" })
  .regex(/[A-Za-z]/, { message: "Password must contain at least one letter" })
  .regex(/\d/, { message: "Password must contain at least one number" });

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Please provide a valid email address" });

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Name must be at least 2 characters long" })
      .max(80, { message: "Name must be 80 characters or fewer" }),
    email,
    password: passwordPolicy,
    role: z.enum(["TENANT", "LANDLORD"], {
      message: "Role must be either 'TENANT' or 'LANDLORD'",
    }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1, { message: "Password is required" }).max(128),
  }),
});

export const googleAuthSchema = z.object({
  body: z.object({
    credential: z.string().min(10, { message: "Google credential is required" }).max(4096),
    role: z.enum(["TENANT", "LANDLORD"]).optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, { message: "Name must be at least 2 characters long" }).max(80).optional(),
    phone: z.string().trim().max(30, { message: "Phone must be 30 characters or fewer" }).optional(),
    avatarUrl: z
      .union([z.literal(""), httpUrl("Avatar must be a valid http(s) URL")])
      .optional(),
    bio: z.string().trim().max(500, { message: "Bio must be 500 characters or fewer" }).optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().max(128).optional(),
    newPassword: passwordPolicy,
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
