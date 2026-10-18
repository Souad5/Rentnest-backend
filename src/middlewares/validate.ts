import type { Request, Response, NextFunction } from "express";
import type { ZodObject } from "zod";

/**
 * Validates `{ body, query, params }` against a Zod object schema and strips
 * unknown fields from `req.body` / `req.params` (mass-assignment protection).
 *
 * NOTE: Express 5 exposes `req.query` as a getter, so it is validated but never
 * reassigned. Controllers read query params via the helpers in utils/query.ts.
 */
export const validate = (schema: ZodObject<any>) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      if ("body" in parsed) req.body = parsed.body;
      if (parsed.params) req.params = parsed.params as typeof req.params;
      next();
    } catch (error) {
      next(error);
    }
  };
};
