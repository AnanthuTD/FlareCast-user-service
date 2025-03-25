import { TOKENS } from "@/app/tokens";
import container from "@/infra/di-container";
import { expressAdapter } from "@/presentation/adapters/express";
import { IController } from "@/presentation/http/controllers/IController";
import { Router, Request, Response } from "express";

const router = Router();

const getAdminPlansController = container.get<IController>(
	TOKENS.GetAdminPlansController
);
const createPlanController = container.get<IController>(
	TOKENS.CreatePlanController
);
const togglePlanActiveController = container.get<IController>(
	TOKENS.TogglePlanActiveController
);

// Fetch all subscription plans
router.get("/", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, getAdminPlansController);
	res.status(adapter.statusCode).json(adapter.body);
});

// Create a new subscription plan
router.post("/", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, createPlanController);
	res.status(adapter.statusCode).json(adapter.body);
});

// Delete a subscription plan by planId
router.patch("/:id/toggle", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, togglePlanActiveController);
	res.status(adapter.statusCode).json(adapter.body);
});

export default router;
