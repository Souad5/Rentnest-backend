import type { Response, NextFunction } from "express";
import { type AuthRequest } from "../middlewares/auth";
export declare const createProperty: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProperty: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteProperty: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getLandlordRequests: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateRequestStatus: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=landlord.controller.d.ts.map