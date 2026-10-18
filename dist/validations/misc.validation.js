import { z } from "zod";
const email = z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: "Please provide a valid email address" })
    .max(254);
export const newsletterSchema = z.object({
    body: z.object({ email }),
});
export const contactSchema = z.object({
    body: z.object({
        name: z.string().trim().min(2, { message: "Name must be at least 2 characters long" }).max(80),
        email,
        subject: z
            .string()
            .trim()
            .min(3, { message: "Subject must be at least 3 characters long" })
            .max(120, { message: "Subject must be 120 characters or fewer" }),
        message: z
            .string()
            .trim()
            .min(10, { message: "Message must be at least 10 characters long" })
            .max(2000, { message: "Message must be 2000 characters or fewer" }),
    }),
});
//# sourceMappingURL=misc.validation.js.map