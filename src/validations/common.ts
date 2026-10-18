import { z } from "zod";

/**
 * Absolute http(s) URL. `z.string().url()` alone accepts any scheme
 * (javascript:, data:, ...), which must never be stored and rendered as a link
 * or image source.
 */
export const httpUrl = (message = "Must be a valid http(s) URL") =>
  z
    .string()
    .trim()
    .url({ message })
    .max(2048)
    .refine((value) => /^https?:\/\//i.test(value), { message });
