import { Router } from "express";
import * as rentalController from "../controllers/rental.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  createRentalRequestSchema,
  updateRentalStatusSchema,
} from "../validations/rental.validation";

const router = Router();

// All rental routes require authentication
router.use(authenticate);

// Tenant Routes
router.post(
  "/",
  authorize("TENANT"),
  validate(createRentalRequestSchema),
  rentalController.createRentalRequest,
);
router.get(
  "/my-requests",
  authorize("TENANT"),
  rentalController.getMyRentalRequests,
);

// Landlord Routes
router.get(
  "/landlord-requests",
  authorize("LANDLORD", "ADMIN"),
  rentalController.getLandlordRequests,
);

// Common Route (Landlord Approve/Reject or Tenant Cancel)
router.patch(
  "/:id/status",
  validate(updateRentalStatusSchema),
  rentalController.updateRequestStatus,
);

export default router;
