import { Router } from "express";
import { PromotionalVideoController } from "../../controllers/admin/promotionalVideo.controller";

const router = Router();

// CRUD Routes
router.post("/signed-url", PromotionalVideoController.getSignedUrl);
router.post("/", PromotionalVideoController.uploadPromotionalVideo);
router.get("/", PromotionalVideoController.getPromotionalVideos);
router.get("/:id", PromotionalVideoController.getPromotionalVideoById);
router.put("/:id", PromotionalVideoController.updatePromotionalVideo);
router.delete("/:id", PromotionalVideoController.deletePromotionalVideo);

export default router;
