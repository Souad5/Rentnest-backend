import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { env } from "../config/env";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public errorDetails: any = null,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const prismaTarget = (meta: Record<string, unknown> | undefined): string | null => {
  const target = meta?.["target"];
  if (Array.isArray(target)) return target.join(", ");
  if (typeof target === "string") return target;
  return null;
};

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Only trust status codes from our own AppError or from http-errors style
  // errors meant for the client (e.g. body-parser). Third-party errors that
  // carry e.g. a 401 must not be forwarded (clients would log the user out).
  let statusCode: number =
    err instanceof AppError
      ? err.statusCode
      : err?.expose === true && typeof err?.status === "number"
        ? err.status
        : 500;
  let message: string = err?.message || "Internal Server Error";
  let errorDetails = err?.errorDetails ?? null;

  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    errorDetails = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const field = prismaTarget(err.meta);
        statusCode = 409;
        message = field
          ? `A record with this ${field} already exists`
          : "A record with these details already exists";
        errorDetails = field ? [{ field, message }] : null;
        break;
      }
      case "P2025":
        statusCode = 404;
        message = "The requested record was not found";
        errorDetails = null;
        break;
      case "P2003":
        statusCode = 400;
        message = "A related record does not exist or is still in use";
        errorDetails = null;
        break;
      default:
        statusCode = 500;
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid data supplied";
    errorDetails = null;
  } else if (err instanceof Stripe.errors.StripeError) {
    if (err instanceof Stripe.errors.StripeCardError) {
      statusCode = 402;
      message = err.message;
    } else {
      statusCode = 502;
      message = "Payment service is temporarily unavailable. Please try again.";
    }
    errorDetails = null;
    console.error(`[${req.method} ${req.originalUrl}] Stripe error:`, err.type, err.message);
  } else if (err?.type === "entity.parse.failed") {
    // express.json() malformed body
    statusCode = 400;
    message = "Malformed JSON request body";
    errorDetails = null;
  }

  if (statusCode < 400 || statusCode > 599) statusCode = 500;

  if (statusCode >= 500) {
    if (err instanceof AppError || err instanceof Stripe.errors.StripeError) {
      // Expected operational error (e.g. feature not configured) — no stack.
      console.error(`[${req.method} ${req.originalUrl}] ${statusCode} ${message}`);
    } else {
      console.error(`[${req.method} ${req.originalUrl}]`, err);
    }
    if (
      env.NODE_ENV === "production" &&
      !(err instanceof AppError) &&
      !(err instanceof Stripe.errors.StripeError)
    ) {
      message = "Internal Server Error";
      errorDetails = null;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails,
  });
};
