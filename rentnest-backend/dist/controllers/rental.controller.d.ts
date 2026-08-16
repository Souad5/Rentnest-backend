import type { Response, NextFunction } from "express";
import { type AuthRequest } from "../middlewares/auth";
export declare const createRentalRequest: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getMyRentalRequests: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getRentalRequestById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rental.controller.d.ts.map