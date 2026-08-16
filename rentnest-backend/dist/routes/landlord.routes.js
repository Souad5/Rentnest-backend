import { Router } from "express";
import * as landlordController from "../controllers/landlord.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { updateRentalStatusSchema } from "../validations/rental.validation";
const router = Router();
// Protect all endpoints with LANDLORD and ADMIN roles
router.use(authenticate, authorize("LANDLORD", "ADMIN"));
// Property Management Routes
router.post("/properties", landlordController.createProperty);
router.put("/properties/:id", landlordController.updateProperty);
router.delete("/properties/:id", landlordController.deleteProperty);
// Rental Request Management Routes
router.get("/requests", landlordController.getLandlordRequests);
router.patch("/requests/:id", validate(updateRentalStatusSchema), landlordController.updateRequestStatus);
export default router;
//# sourceMappingURL=landlord.routes.js.map