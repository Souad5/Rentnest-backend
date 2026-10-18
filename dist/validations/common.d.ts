import { z } from "zod";
/**
 * Absolute http(s) URL. `z.string().url()` alone accepts any scheme
 * (javascript:, data:, ...), which must never be stored and rendered as a link
 * or image source.
 */
export declare const httpUrl: (message?: string) => z.ZodString;
//# sourceMappingURL=common.d.ts.map