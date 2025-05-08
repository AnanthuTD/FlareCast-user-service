import express, { Request, Response } from "express";
import { expressAdapter } from "@/presentation/adapters/express";
import container from "@/infra/di-container";
import { TOKENS } from "@/app/tokens";
import { IController } from "@/presentation/http/controllers/IController";

const subscriptionRoutes = express.Router();

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
const getUserPlansWithSubscriptionController = container.get<IController>(
	TOKENS.GetUserPlansWithSubscriptionController
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
const getAdminPlansController = container.get<IController>(
	TOKENS.GetAdminPlansController
);
const createPlanController = container.get<IController>(
	TOKENS.CreatePlanController
);
const togglePlanActiveController = container.get<IController>(
	TOKENS.TogglePlanActiveController
);

// Anyone can see available subscription plans—no login needed.
subscriptionRoutes.get("/public/plans", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, getPlansController);
	res.status(adapter.statusCode).json(adapter.body);
});

// authenticated users.
subscriptionRoutes.get("/plans", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, getUserPlansWithSubscriptionController);
	res.status(adapter.statusCode).json(adapter.body);
});

// Admins use this to get a full list of plans, including inactive ones.
subscriptionRoutes.get("/admin/plans", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, getAdminPlansController);
	res.status(adapter.statusCode).json(adapter.body);
});

// Admins can create a new subscription plan.
subscriptionRoutes.post("/admin/plans", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, createPlanController);
	res.status(adapter.statusCode).json(adapter.body);
});

// Admins toggle a plan’s active status here.
subscriptionRoutes.patch(
	"/admin/plans/:id/toggle",
	async (req: Request, res: Response) => {
		const adapter = await expressAdapter(req, togglePlanActiveController);
		res.status(adapter.statusCode).json(adapter.body);
	}
);

// Verifies payment after the payment.
subscriptionRoutes.post(
	"/verify-payment",
	async (req: Request, res: Response) => {
		const httpResponse = await expressAdapter(req, verifyPaymentController);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
);

// Checks if a logged-in user is eligible to subscribe (not already on a plan).
subscriptionRoutes.get("/eligibility", async (req: Request, res: Response) => {
	const httpResponse = await expressAdapter(req, canSubscribeController);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

// Lets a logged-in user subscribe to a plan.
subscriptionRoutes.post("/subscribe", async (req: Request, res: Response) => {
	const httpResponse = await expressAdapter(req, subscribeController);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

// Shows a logged-in user their active subscriptions.
subscriptionRoutes.get("/current", async (req: Request, res: Response) => {
	const httpResponse = await expressAdapter(req, getSubscriptionsController);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

// Cancels a logged-in user’s subscription.
subscriptionRoutes.post("/cancel", async (req: Request, res: Response) => {
	const httpResponse = await expressAdapter(req, cancelSubscriptionController);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

// Fetches a specific subscription by Razorpay ID (for displaying the status of payment, success or failure).
subscriptionRoutes.get(
	"/:razorpaySubscriptionId",
	async (req: Request, res: Response) => {
		const httpResponse = await expressAdapter(req, getSubscriptionByRazorpayId);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
);

export { subscriptionRoutes };
