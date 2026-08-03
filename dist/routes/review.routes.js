import { Router } from "express";
import * as reviewController from "../controllers/review.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createReviewSchema } from "../validations/review.validation";
const router = Router();
// Public Route: Fetch reviews and average rating for a property
router.get("/property/:propertyId", reviewController.getPropertyReviews);
// Protected Route: Submit a review (Tenant only)
router.post("/", authenticate, authorize("TENANT"), validate(createReviewSchema), reviewController.createReview);
export default router;
//# sourceMappingURL=review.routes.js.map