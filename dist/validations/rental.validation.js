import { z } from "zod";
export const createRentalRequestSchema = z.object({
    body: z.object({
        propertyId: z.string().uuid({ message: "Valid Property UUID is required" }),
        startDate: z
            .string()
            .datetime({ message: "Start date must be a valid ISO date string" }),
        endDate: z
            .string()
            .datetime({ message: "End date must be a valid ISO date string" }),
        specialNotes: z.string().optional(),
    }),
});
export const updateRentalStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid({ message: "Valid Rental Request UUID is required" }),
    }),
    body: z.object({
        status: z.enum(["APPROVED", "REJECTED", "CANCELLED"], {
            message: "Status must be 'APPROVED', 'REJECTED', or 'CANCELLED'",
        }),
    }),
});
//# sourceMappingURL=rental.validation.js.map