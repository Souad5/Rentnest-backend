import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middlewares/auth";
export declare const createPaymentIntent: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const confirmPayment: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getUserPayments: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getPaymentById: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=payment.controller.d.ts.map