import { TOKENS } from "@/app/tokens";
import container from "@/infra/di-container";
import { expressAdapter } from "@/presentation/adapters/express";
import { IController } from "@/presentation/http/controllers/IController";
import { Router, Request, Response } from "express";

const promotionalRoutes = Router();

const getSignedUrlController = container.get<IController>(
	TOKENS.GetSignedUrlController
);
const uploadPromotionalVideoController = container.get<IController>(
	TOKENS.UploadPromotionalVideoController
);
const getPromotionalVideosController = container.get<IController>(
	TOKENS.GetPromotionalVideosController
);
const getPromotionalVideoByIdController = container.get<IController>(
	TOKENS.GetPromotionalVideoByIdController
);
const updatePromotionalVideoController = container.get<IController>(
	TOKENS.UpdatePromotionalVideoController
);
const deletePromotionalVideoController = container.get<IController>(
	TOKENS.DeletePromotionalVideoController
);

promotionalRoutes.post("/signed-url", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, getSignedUrlController);
	res.status(adapter.statusCode).json(adapter.body);
});

promotionalRoutes.post("/", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, uploadPromotionalVideoController);
	res.status(adapter.statusCode).json(adapter.body);
});

promotionalRoutes.get("/", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, getPromotionalVideosController);
	res.status(adapter.statusCode).json(adapter.body);
});

promotionalRoutes.get("/:id", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, getPromotionalVideoByIdController);
	res.status(adapter.statusCode).json(adapter.body);
});

promotionalRoutes.put("/:id", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, updatePromotionalVideoController);
	res.status(adapter.statusCode).json(adapter.body);
});

promotionalRoutes.delete("/:id", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, deletePromotionalVideoController);
	res.status(adapter.statusCode).json(adapter.body);
});

export default promotionalRoutes