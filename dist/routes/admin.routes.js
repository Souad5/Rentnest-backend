import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { banUserSchema, categoryIdParamSchema, categorySchema, messageIdParamSchema, messageReadSchema, propertyAvailabilitySchema, propertyIdParamSchema, reviewIdParamSchema, updateCategorySchema, } from "../validations/admin.validation";
const router = Router();
// Protect all admin endpoints with authentication and ADMIN role check
router.use(authenticate, authorize("ADMIN"));
router.get("/stats", adminController.getStats);
// Users
router.get("/users", adminController.getAllUsers);
router.patch("/users/:id", validate(banUserSchema), adminController.toggleUserBan);
// Properties
router.get("/properties", adminController.getAllSystemProperties);
router.patch("/properties/:id", validate(propertyAvailabilitySchema), adminController.setPropertyAvailability);
router.delete("/properties/:id", validate(propertyIdParamSchema), adminController.deleteSystemProperty);
// Rentals & payments
router.get("/rentals", adminController.getAllSystemRentals);
router.get("/payments", adminController.getAllPayments);
// Categories
router.get("/categories", adminController.getAllCategories);
router.post("/categories", validate(categorySchema), adminController.createCategory);
router.put("/categories/:id", validate(updateCategorySchema), adminController.updateCategory);
router.delete("/categories/:id", validate(categoryIdParamSchema), adminController.deleteCategory);
// Reviews
router.get("/reviews", adminController.getAllReviews);
router.delete("/reviews/:id", validate(reviewIdParamSchema), adminController.deleteReview);
// Contact messages & newsletter
router.get("/messages", adminController.getMessages);
router.patch("/messages/:id", validate(messageReadSchema), adminController.setMessageRead);
router.delete("/messages/:id", validate(messageIdParamSchema), adminController.deleteMessage);
router.get("/subscribers", adminController.getSubscribers);
export default router;
//# sourceMappingURL=admin.routes.js.map