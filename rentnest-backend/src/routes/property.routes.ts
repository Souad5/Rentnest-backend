import { Router } from "express";
import * as propertyController from "../controllers/property.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createPropertySchema,
  updatePropertySchema,
} from "../validations/property.validation";

const router = Router();

// Public Routes
router.get("/categories", propertyController.getCategories);
router.get("/", propertyController.getProperties);
router.get("/:id", propertyController.getPropertyById);

// Landlord / Admin Protected Routes
router.post(
  "/landlord",
  authenticate,
  authorize("LANDLORD", "ADMIN"),
  validate(createPropertySchema),
  propertyController.createProperty,
);

router.put(
  "/landlord/:id",
  authenticate,
  authorize("LANDLORD", "ADMIN"),
  validate(updatePropertySchema),
  propertyController.updateProperty,
);

router.delete(
  "/landlord/:id",
  authenticate,
  authorize("LANDLORD", "ADMIN"),
  propertyController.deleteProperty,
);

export default router;
