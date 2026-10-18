import { Router } from "express";
import * as landlordController from "../controllers/landlord.controller";
import * as propertyController from "../controllers/property.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { updateRentalStatusSchema } from "../validations/rental.validation";
import {
  createPropertySchema,
  propertyIdParamSchema,
  updatePropertySchema,
} from "../validations/property.validation";

const router = Router();

// Protect all endpoints with LANDLORD and ADMIN roles
router.use(authenticate, authorize("LANDLORD", "ADMIN"));

// Dashboard
router.get("/stats", landlordController.getLandlordStats);
router.get("/payments", landlordController.getLandlordPayments);

// Property Management (same handlers as /properties/landlord/*)
router.get("/properties", landlordController.getMyProperties);
router.post("/properties", validate(createPropertySchema), propertyController.createProperty);
router.put("/properties/:id", validate(updatePropertySchema), propertyController.updateProperty);
router.delete(
  "/properties/:id",
  validate(propertyIdParamSchema),
  propertyController.deleteProperty,
);

// Rental Request Management
router.get("/requests", landlordController.getLandlordRequests);
router.patch(
  "/requests/:id",
  validate(updateRentalStatusSchema),
  landlordController.updateRequestStatus,
);

export default router;
