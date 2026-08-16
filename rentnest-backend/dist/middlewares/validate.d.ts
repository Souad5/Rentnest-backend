import type { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";
export declare const validate: (schema: ZodObject<any>) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validate.d.ts.map