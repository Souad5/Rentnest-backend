import type { Request, Response, NextFunction } from "express";
import { type AuthRequest } from "../middlewares/auth";
export declare const getAllUsers: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const toggleUserBan: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllSystemProperties: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createCategory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateCategory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteCategory: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllSystemRentals: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=admin.controller.d.ts.map