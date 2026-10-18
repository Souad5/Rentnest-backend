import { Router } from "express";
import * as reviewController from "../controllers/review.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { createReviewSchema } from "../validations/review.validation";
const router = Router();
// Public
router.get("/latest", reviewController.getLatestReviews);
router.get("/property/:propertyId", reviewController.getPropertyReviews);
// Tenant
router.get("/my", authenticate, authorize("TENANT"), reviewController.getMyReviews);
router.post("/", authenticate, authorize("TENANT"), validate(createReviewSchema), reviewController.createReview);
export default router;
//# sourceMappingURL=review.routes.js.map