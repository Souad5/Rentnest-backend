import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth";
export declare const getCategories: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getProperties: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getLocations: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPublicStats: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getTrendingProperties: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getPropertyById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getRelatedProperties: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createProperty: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProperty: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteProperty: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=property.controller.d.ts.map