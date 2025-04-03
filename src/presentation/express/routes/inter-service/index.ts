import { Request, Response, Router } from "express";
import {  UploadVideoPermissionsController } from "@/presentation/http/controllers/service/VideoUploadPermission";
import { expressAdapter } from "@/presentation/adapters/express";
import container from "@/infra/di-container";
import { TOKENS } from "@/app/tokens";
const router = Router();

const videoPermissionsController = container.get(
	TOKENS.ServiceUploadVideoPermissionsController
);

router.get("/:userId/upload-permission", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, videoPermissionsController);
	res.status(adapter.statusCode).json(adapter.body);
});

export default router;
