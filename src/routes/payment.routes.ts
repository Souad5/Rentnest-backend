import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createPaymentIntentSchema,
  confirmPaymentSchema,
} from "../validations/payment.validation";

const router = Router();

// Stripe webhook: public, signature-verified, raw body required.
// Registered BEFORE `authenticate` so Stripe can call it without a user token.
router.post("/webhook", paymentController.stripeWebhook);

// Require login for all payment endpoints
router.use(authenticate);

router.post(
  "/create",
  validate(createPaymentIntentSchema),
  paymentController.createPaymentIntent,
);
router.post(
  "/confirm",
  validate(confirmPaymentSchema),
  paymentController.confirmPayment,
);

// GET /api/payments (Payment History)
router.get("/", paymentController.getUserPayments);

// GET /api/payments/:id (Payment Details)
router.get("/:id", paymentController.getPaymentById);

export default router;
