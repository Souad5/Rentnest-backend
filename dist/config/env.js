// src/config/env.ts
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();
// Treat empty strings (e.g. `ANTHROPIC_API_KEY=` in .env) as "not set".
const optionalString = z.preprocess((value) => (typeof value === "string" && value.trim() === "" ? undefined : value), z.string().optional());
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
    STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
    // Optional integrations — features degrade gracefully when unset.
    ANTHROPIC_API_KEY: optionalString,
    GOOGLE_CLIENT_ID: optionalString,
    // Comma-separated list of allowed CORS origins. Unset = allow all (local dev).
    CLIENT_URL: optionalString,
});
export const env = envSchema.parse(process.env);
export const allowedOrigins = (env.CLIENT_URL ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter((origin) => origin.length > 0);
//# sourceMappingURL=env.js.map