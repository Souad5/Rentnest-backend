import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./errorHandler";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next(new AppError(401, "Access denied. No token provided."));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    next(new AppError(401, "Invalid or expired token."));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(
          403,
          "Forbidden: You do not have permission to access this resource",
        ),
      );
    }
    next();
  };
};
