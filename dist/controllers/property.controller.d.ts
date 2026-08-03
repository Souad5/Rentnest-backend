import type { Request, Response, NextFunction } from "express";
import { type AuthRequest } from "../middlewares/auth";
export declare const getCategories: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getProperties: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPropertyById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createProperty: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProperty: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteProperty: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=property.controller.d.ts.map