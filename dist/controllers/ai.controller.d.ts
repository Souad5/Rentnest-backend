import type { Request, Response, NextFunction } from "express";
export declare const getStatus: (_req: Request, res: Response) => void;
export declare const searchSuggestions: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const chat: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const propertyDescription: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const adminInsights: (_req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=ai.controller.d.ts.map