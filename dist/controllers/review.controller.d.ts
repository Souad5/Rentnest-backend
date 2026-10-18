import type { Request, Response, NextFunction } from "express";
import { type AuthRequest } from "../middlewares/auth";
export declare const createReview: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getPropertyReviews: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getLatestReviews: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getMyReviews: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=review.controller.d.ts.map