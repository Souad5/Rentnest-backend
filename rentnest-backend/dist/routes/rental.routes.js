import { Router } from "express";
import * as rentalController from "../controllers/rental.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createRentalRequestSchema } from "../validations/rental.validation";
const router = Router();
router.use(authenticate);
// Tenant Routes
router.post("/", authorize("TENANT"), validate(createRentalRequestSchema), rentalController.createRentalRequest);
router.get("/my-requests", authorize("TENANT"), rentalController.getMyRentalRequests);
// Get specific rental request details
router.get("/:id", authorize("TENANT", "LANDLORD", "ADMIN"), rentalController.getRentalRequestById);
export default router;
//# sourceMappingURL=rental.routes.js.map