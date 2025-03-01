import express from "express";
import { webhookController } from "../controllers/razorpay/webhook.controller";

const webhookRouter = express.Router();

webhookRouter.post(
	"/subscriptions",
	express.raw({ type: "application/json" }),
	webhookController.handleSubscriptionWebhook
);

export default webhookRouter;
