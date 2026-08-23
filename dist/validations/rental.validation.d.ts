import { z } from "zod";
export declare const createRentalRequestSchema: z.ZodObject<{
    body: z.ZodObject<{
        propertyId: z.ZodString;
        startDate: z.ZodString;
        endDate: z.ZodString;
        specialNotes: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const updateRentalStatusSchema: z.ZodObject<{
    params: z.ZodObject<{
        id: z.ZodString;
    }, z.core.$strip>;
    body: z.ZodObject<{
        status: z.ZodEnum<{
            APPROVED: "APPROVED";
            CANCELLED: "CANCELLED";
            REJECTED: "REJECTED";
        }>;
    }, z.core.$strip>;
}, z.core.$strip>;
//# sourceMappingURL=rental.validation.d.ts.map