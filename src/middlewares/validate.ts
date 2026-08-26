import type { Request, Response, NextFunction } from "express";
import { ZodObject } from "zod";

export const validate = (schema: ZodObject<any>) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body;
      if (parsed.query) req.query = parsed.query as typeof req.query;
      if (parsed.params) req.params = parsed.params as typeof req.params;
      next();
    } catch (error) {
      next(error);
    }
  };
};
