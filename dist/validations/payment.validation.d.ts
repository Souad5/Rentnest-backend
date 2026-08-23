import { z } from "zod";
export declare const createPaymentIntentSchema: z.ZodObject<{
    body: z.ZodObject<{
        rentalRequestId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const confirmPaymentSchema: z.ZodObject<{
    body: z.ZodObject<{
        paymentIntentId: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=payment.validation.d.ts.map