import express, { Request, Response } from "express";
import { expressAdapter } from "@/presentation/adapters/express";
import container from "@/infra/di-container";
import { TOKENS } from "@/app/tokens";
import { IController } from "@/presentation/http/controllers/IController";

/**
 * Router for handling subscription-related routes.
 */
const subscriptionRoutes = express.Router();

// Fetch controllers using TypeDI
const canSubscribeController = container.get<IController>(
	TOKENS.CanSubscribeController
);
const subscribeController = container.get<IController>(
	TOKENS.CreateSubscribeController
);
const getSubscriptionsController = container.get<IController>(
	TOKENS.GetSubscriptionsController
);
const getPlansController = container.get<IController>(
	TOKENS.GetPlansController
);
const cancelSubscriptionController = container.get<IController>(
	TOKENS.CancelSubscriptionController
);
const verifyPaymentController = container.get<IController>(
	TOKENS.VerifyPaymentController
);
const getSubscriptionByRazorpayId = container.get<IController>(
	TOKENS.GetSubscriptionByRazorpayId
);

/**
 * Endpoint to check if the payment is valid.
 */
subscriptionRoutes.post(
	"/verify-payment",
	async (req: Request, res: Response) => {
		const httpResponse = await expressAdapter(req, verifyPaymentController);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
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

subscriptionRoutes.get(
	"/:razorpaySubscriptionId",
	async (req: Request, res: Response) => {
		const httpResponse = await expressAdapter(req, getSubscriptionByRazorpayId);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
);

export { subscriptionRoutes };
