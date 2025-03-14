import { Router } from "express";
import { limitsController } from "../../controllers/user/limits.controller";
const router = Router()

router.get(
  "/:userId/upload-permission",
  limitsController.serviceUploadVideoPermissions
);

export default router