import { Request, Response, Router } from "express";
import { ServiceUploadVideoPermissionsController } from "@/presentation/http/controllers/service/VideoUploadPermission";
import Container from "typedi";
import { expressAdapter } from "@/presentation/adapters/express";
const router = Router();

const videoPermissionsController = Container.get(
	ServiceUploadVideoPermissionsController
);

router.get("/:userId/upload-permission", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, videoPermissionsController);
	res.status(adapter.statusCode).json(adapter.body);
});

export default router;
