import { z } from "zod";
export declare const newsletterSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const contactSchema: z.ZodObject<{
    body: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        subject: z.ZodString;
        message: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=misc.validation.d.ts.map