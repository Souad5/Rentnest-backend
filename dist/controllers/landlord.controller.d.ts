import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth";
export declare const getMyProperties: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getLandlordRequests: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateRequestStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getLandlordStats: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getLandlordPayments: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=landlord.controller.d.ts.map