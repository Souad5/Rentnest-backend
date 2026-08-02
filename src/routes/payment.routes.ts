import { Router } from "express";
import {
  createPaymentIntent,
  confirmPayment,
  getUserPayments,
} from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createPaymentIntentSchema,
  confirmPaymentSchema,
} from "../validations/payment.validation";

const router = Router();

router.use(authenticate); // Require login for all payment endpoints

router.post(
  "/create",
  validate(createPaymentIntentSchema),
  createPaymentIntent,
);
router.post("/confirm", validate(confirmPaymentSchema), confirmPayment);
router.get("/", getUserPayments);

export default router;
