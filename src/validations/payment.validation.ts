import { z } from "zod";

export const createPaymentIntentSchema = z.object({
  body: z.object({
    rentalRequestId: z
      .string()
      .uuid({ message: "Valid Rental Request UUID is required" }),
  }),
});

export const confirmPaymentSchema = z.object({
  body: z.object({
    paymentIntentId: z
      .string()
      .min(1, { message: "Stripe PaymentIntent ID is required" }),
  }),
});
