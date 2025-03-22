import { Router, Request, Response } from "express";
import { Container } from "typedi";
import { GetPlansController } from "@/presentation/http/controllers/subscription/Plans";
import authRoutes from "./authenticate";
import { webhookRoutes } from "./webhook.router";
import { protectedUserRoutes } from "./protected";
import { expressAdapter } from "@/presentation/adapters/express";

/**
 * Main router for combining all route modules.
 */
const mainRouter = Router();

// Fetch controller using TypeDI
const plansController = Container.get(GetPlansController);

/**
 * Unprotected Routes
 */

/**
 * Endpoint to fetch available subscription plans (public).
 */
mainRouter.get("/subscription-plans", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, plansController);
	res.status(adapter.statusCode).json(adapter.body);
});

/**
 * Authentication-related routes (public and protected).
 */
mainRouter.use("/auth", authRoutes);

/**
 * Webhook-related routes (public).
 */
mainRouter.use("/webhook", webhookRoutes);

authRoutes.use("/", protectedUserRoutes);

export { mainRouter };
