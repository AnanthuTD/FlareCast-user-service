import express, { Request, Response } from "express";
import { HandleSubscriptionWebhookController } from "@/presentation/http/controllers/subscription/Webhook";
import { expressAdapter } from "@/presentation/adapters/express";
import container from "@/infra/di-container";
import { TOKENS } from "@/app/tokens";

/**
 * Router for handling webhook-related routes.
 */
const webhookRoutes = express.Router();

// Fetch controller using TypeDI
const webhookController = container.get(TOKENS.HandleSubscriptionWebhookController);

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
