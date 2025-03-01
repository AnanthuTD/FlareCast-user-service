import { Request, Response } from "express";
import { Container, Service, Inject } from "typedi";
import crypto from "node:crypto";
import { UserSubscriptionRepository } from "../../repositories/userSubscription.repository";
import eventEmitter from "../../eventEmitter";
import EventName from "../../eventEmitter/eventNames";
import env from "../../env";

@Service()
export class WebhookController {
	constructor(@Inject() private subscriptionRepo: UserSubscriptionRepository) {}

	// Helper function to verify webhook signature
	private verifyWebhookSignature(
		payload: string,
		signature: string | string[] | undefined,
		secret: string
	): boolean {
		const generatedSignature = crypto
			.createHmac("sha256", secret)
			.update(payload)
			.digest("hex");
		return generatedSignature === signature;
	}

	// Helper function to check if event is relevant
	private isEventRelevant(
		eventType: string,
		currentStatus: string | null,
		eventTimestamp: number,
		updatedAt: Date | null
	): boolean {
		const finalStates = ["completed", "cancelled", "expired"]; // Adjust based on your statuses
		const currentTimestamp = updatedAt
			? Math.floor(updatedAt.getTime() / 1000)
			: 0;
		return (
			!currentStatus ||
			!finalStates.includes(currentStatus) ||
			eventType === "subscription.updated" ||
			eventTimestamp > currentTimestamp
		);
	}

	// Main webhook handler
	handleSubscriptionWebhook = async (req: Request, res: Response) => {
		try {
			const razorpaySignature = req.headers["x-razorpay-signature"];
			const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

			// Verify signature
			if (
				!razorpaySignature ||
				!this.verifyWebhookSignature(
					JSON.stringify(req.body),
					razorpaySignature,
					webhookSecret
				)
			) {
				console.error("Invalid webhook signature");
				res.status(400).json({ error: "Invalid webhook signature" });
				return;
			}

			const event = req.body
			console.log("Webhook event:", JSON.stringify(event, null, 2));

			const subscription = event.payload.subscription.entity;
			const subscriptionId = subscription.id;
			const eventTimestamp = event.created_at;
			const status = subscription.status;
			const startDate = subscription.start_at
				? new Date(subscription.start_at * 1000)
				: null;
			const endDate = subscription.end_at
				? new Date(subscription.end_at * 1000)
				: null;
			const chargeAt = subscription.charge_at
				? new Date(subscription.charge_at * 1000)
				: null;
			const paidCount = subscription.paid_count || 0;
			const currentStart = subscription.current_start
				? new Date(subscription.current_start * 1000)
				: null;
			const currentEnd = subscription.current_end
				? new Date(subscription.current_end * 1000)
				: null;

			// Fetch current subscription state
			const currentSubscription =
				await this.subscriptionRepo.getUserSubscriptionByRazorpayId(
					subscriptionId
				);

			// Check if event is relevant
			if (
				!this.isEventRelevant(
					event.event,
					currentSubscription?.status || null,
					eventTimestamp,
					currentSubscription?.updatedAt || null
				)
			) {
				console.log(
					`Ignoring event ${event.event} for subscription ${subscriptionId} as it has been processed or is in a final state.`
				);
				res.status(200).json({ success: true });
				return;
			}

			// Update subscription
			const updatedSubscription =
				await this.subscriptionRepo.updateUserSubscription(subscriptionId, {
					status,
					updatedAt: new Date(eventTimestamp * 1000),
					startDate,
					endDate,
					chargeAt,
					paidCount,
					currentStart,
					currentEnd,
				});

			console.log(`Subscription ${subscriptionId} status updated to ${status}`);

			// Emit Socket.IO event
			eventEmitter.emit(EventName.SUBSCRIPTION_STATUS_UPDATE, {
				userId: updatedSubscription.userId,
				subscriptionId,
				status,
			});

			res.status(200).json({ success: true });
		} catch (error) {
			console.error("Webhook error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	};
}

// Export singleton instance for TypeDI
export const webhookController = Container.get(WebhookController);
