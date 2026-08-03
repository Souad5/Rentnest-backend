// src/config/env.ts
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: z.string().transform(Number).default(5000),
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z
        .string()
        .min(32, "JWT_SECRET must be at least 32 characters long"),
    STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
});
export const env = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map