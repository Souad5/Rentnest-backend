import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  banUserSchema,
  categorySchema,
  updateCategorySchema,
} from "../validations/admin.validation";

const router = Router();

// Protect all admin endpoints with authentication and ADMIN role check
router.use(authenticate, authorize("ADMIN"));

// User Management Routes
router.get("/users", adminController.getAllUsers);
router.patch(
  "/users/:id/ban",
  validate(banUserSchema),
  adminController.toggleUserBan,
);

// Property Management Routes
router.get("/properties", adminController.getAllSystemProperties);

// Category Management Routes
router.post(
  "/categories",
  validate(categorySchema),
  adminController.createCategory,
);
router.put(
  "/categories/:id",
  validate(updateCategorySchema),
  adminController.updateCategory,
);
router.delete("/categories/:id", adminController.deleteCategory);

export default router;
