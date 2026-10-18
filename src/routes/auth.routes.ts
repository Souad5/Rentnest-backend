import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { validate } from "../middlewares/validate";
import { authenticate } from "../middlewares/auth";
import { authLimiter } from "../middlewares/rateLimit";
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validations/auth.validation";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), authController.register);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/google", authLimiter, validate(googleAuthSchema), authController.googleAuth);

router.get("/me", authenticate, authController.getMe);
router.patch("/me", authenticate, validate(updateProfileSchema), authController.updateMe);
router.patch(
  "/password",
  authenticate,
  validate(changePasswordSchema),
  authController.changePassword,
);

export default router;
