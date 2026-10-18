import { Router } from "express";
import * as aiController from "../controllers/ai.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { aiLimiter } from "../middlewares/rateLimit";
import { chatSchema, propertyDescriptionSchema, searchSuggestionsSchema, } from "../validations/ai.validation";
const router = Router();
router.use(aiLimiter);
router.get("/status", aiController.getStatus);
router.post("/search-suggestions", validate(searchSuggestionsSchema), aiController.searchSuggestions);
router.post("/chat", validate(chatSchema), aiController.chat);
router.post("/property-description", authenticate, authorize("LANDLORD", "ADMIN"), validate(propertyDescriptionSchema), aiController.propertyDescription);
router.get("/admin-insights", authenticate, authorize("ADMIN"), aiController.adminInsights);
export default router;
//# sourceMappingURL=ai.routes.js.map