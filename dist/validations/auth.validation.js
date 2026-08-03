import { z } from "zod";
export const registerSchema = z.object({
    body: z.object({
        name: z
            .string()
            .min(2, { message: "Name must be at least 2 characters long" }),
        email: z
            .string()
            .email({ message: "Please provide a valid email address" }),
        password: z
            .string()
            .min(6, { message: "Password must be at least 6 characters long" }),
        role: z.enum(["TENANT", "LANDLORD"], {
            message: "Role must be either 'TENANT' or 'LANDLORD'",
        }),
    }),
});
export const loginSchema = z.object({
    body: z.object({
        email: z
            .string()
            .email({ message: "Please provide a valid email address" }),
        password: z.string().min(1, { message: "Password is required" }),
    }),
});
//# sourceMappingURL=auth.validation.js.map