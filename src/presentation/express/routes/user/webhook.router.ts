import express, { Request, Response } from "express";
import { Container } from "typedi";
import { HandleSubscriptionWebhookController } from "@/presentation/http/controllers/subscription/Webhook";
import { expressAdapter } from "@/presentation/adapters/express";

/**
 * Router for handling webhook-related routes.
 */
const webhookRoutes = express.Router();

// Fetch controller using TypeDI
const webhookController = Container.get(HandleSubscriptionWebhookController);

/**
 * Endpoint to handle Razorpay subscription webhooks (public).
 */
webhookRoutes.post(
	"/razorpay",
	express.raw({ type: "application/json" }),
	async (req: Request, res: Response) => {
		const httpResponse = await expressAdapter(req, webhookController);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
);

export { webhookRoutes };
