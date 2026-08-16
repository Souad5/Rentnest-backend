import type { Request, Response, NextFunction } from "express";
export declare class AppError extends Error {
    statusCode: number;
    message: string;
    errorDetails: any;
    constructor(statusCode: number, message: string, errorDetails?: any);
}
export declare const errorHandler: (err: any, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map