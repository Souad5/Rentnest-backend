import { Router } from "express";
import * as propertyController from "../controllers/property.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createPropertySchema,
  propertyIdParamSchema,
  updatePropertySchema,
} from "../validations/property.validation";

const router = Router();

// Public Routes (static paths BEFORE /:id)
router.get("/", propertyController.getProperties);
router.get("/categories", propertyController.getCategories);
router.get("/locations", propertyController.getLocations);
router.get("/stats", propertyController.getPublicStats);
router.get("/trending", propertyController.getTrendingProperties);

// Landlord / Admin Protected Routes (also aliased under /landlord/properties)
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
  validate(propertyIdParamSchema),
  propertyController.deleteProperty,
);

router.get("/:id", propertyController.getPropertyById);
router.get("/:id/related", propertyController.getRelatedProperties);

export default router;
