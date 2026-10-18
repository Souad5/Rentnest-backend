import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth";
export declare const publicUserSelect: {
    id: true;
    name: true;
    email: true;
    role: true;
    isBanned: true;
    phone: true;
    avatarUrl: true;
    bio: true;
    authProvider: true;
    createdAt: true;
    updatedAt: true;
};
export declare const register: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const login: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const googleAuth: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getMe: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateMe: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const changePassword: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map