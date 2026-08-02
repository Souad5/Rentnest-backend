import { Router } from "express";
import * as paymentController from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createPaymentIntentSchema,
  confirmPaymentSchema,
} from "../validations/payment.validation";

const router = Router();

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
router.get("/", paymentController.getUserPayments);

export default router;
