import { z } from "zod";
export declare const createReviewSchema: z.ZodObject<{
    body: z.ZodObject<{
        propertyId: z.ZodString;
        rating: z.ZodNumber;
        comment: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=review.validation.d.ts.map