import { Router, Request, Response } from "express";
import authRoutes from "./authenticate";
import { webhookRoutes } from "./webhook.router";
import { protectedUserRoutes } from "./protected";
import { expressAdapter } from "@/presentation/adapters/express";
import container from "@/infra/di-container";
import { TOKENS } from "@/app/tokens";

/**
 * Main router for combining all route modules.
 */
const userRouter = Router();

// Fetch controller using TypeDI
const plansController = container.get(TOKENS.GetPlansController);

/**
 * Unprotected Routes
 */

/**
 * Endpoint to fetch available subscription plans (public).
 */
userRouter.get("/subscription-plans", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, plansController);
	res.status(adapter.statusCode).json(adapter.body);
});

/**
 * Authentication-related routes (public and protected).
 */
userRouter.use("/auth", authRoutes);

/**
 * Webhook-related routes (public).
 */
userRouter.use("/webhook", webhookRoutes);

userRouter.use("/", protectedUserRoutes);

export default userRouter;
