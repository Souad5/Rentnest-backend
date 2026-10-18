import rateLimit from "express-rate-limit";

const body = (message: string) => ({ success: false, message, errorDetails: null });

// Login / register / Google sign-in: 20 requests per 15 minutes per IP.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: body("Too many authentication attempts. Please try again in a few minutes."),
});

// AI endpoints: 30 requests per minute per IP.
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: body("Too many AI requests. Please slow down and try again shortly."),
});

// Public forms (newsletter / contact): 20 submissions per 15 minutes per IP.
export const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: body("Too many submissions. Please try again later."),
});
