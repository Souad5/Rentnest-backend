import { Router } from "express";
import * as miscController from "../controllers/misc.controller";
import { validate } from "../middlewares/validate";
import { publicFormLimiter } from "../middlewares/rateLimit";
import { contactSchema, newsletterSchema } from "../validations/misc.validation";

const router = Router();

router.post(
  "/newsletter",
  publicFormLimiter,
  validate(newsletterSchema),
  miscController.subscribeNewsletter,
);
router.post(
  "/contact",
  publicFormLimiter,
  validate(contactSchema),
  miscController.submitContactMessage,
);

export default router;
