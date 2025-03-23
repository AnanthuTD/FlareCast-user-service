import express, { Request, Response } from "express";
import { CanSubscribeController } from "@/presentation/http/controllers/subscription/CanSubscribe";
import { GetSubscriptionsController } from "@/presentation/http/controllers/subscription/History";
import { GetPlansController } from "@/presentation/http/controllers/subscription/Plans";
import { CancelSubscriptionController } from "@/presentation/http/controllers/subscription/Cancel";
import { expressAdapter } from "@/presentation/adapters/express";
import { CreateSubscribeController } from "@/presentation/http/controllers/subscription/Create";
import container from "@/infra/di-container";
import { TOKENS } from "@/app/tokens";

/**
 * Router for handling subscription-related routes.
 */
const subscriptionRoutes = express.Router();

// Fetch controllers using TypeDI
const canSubscribeController = container.get(TOKENS.CanSubscribeController);
const subscribeController = container.get(TOKENS.CreateSubscribeController);
const getSubscriptionsController = container.get(
	TOKENS.GetSubscriptionsController
);
const getPlansController = container.get(TOKENS.GetPlansController);
const cancelSubscriptionController = container.get(
	TOKENS.CancelSubscriptionController
);

/**
 * Endpoint to check if the authenticated user can subscribe (requires authentication).
 */
subscriptionRoutes.get("/canSubscribe", async (req: Request, res: Response) => {
	const httpResponse = await expressAdapter(req, canSubscribeController);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

/**
 * Endpoint to subscribe the authenticated user to a plan (requires authentication).
 */
subscriptionRoutes.post("/subscribe", async (req: Request, res: Response) => {
	const httpResponse = await expressAdapter(req, subscribeController);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

/**
 * Endpoint to fetch the authenticated user's subscriptions (requires authentication).
 */
subscriptionRoutes.get("/", async (req: Request, res: Response) => {
	const httpResponse = await expressAdapter(req, getSubscriptionsController);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

/**
 * Endpoint to fetch available subscription plans (requires authentication).
 */
subscriptionRoutes.get("/plans", async (req: Request, res: Response) => {
	const httpResponse = await expressAdapter(req, getPlansController);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

/**
 * Endpoint to cancel the authenticated user's subscription (requires authentication).
 */
subscriptionRoutes.post("/cancel", async (req: Request, res: Response) => {
	const httpResponse = await expressAdapter(req, cancelSubscriptionController);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

export { subscriptionRoutes };
