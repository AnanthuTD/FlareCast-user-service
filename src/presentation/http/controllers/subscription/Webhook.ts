import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { Inject } from "typedi";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { IRazorpayManager } from "@/app/providers/IRazorpayManager";
import EventName from "@/app/event-names";
import { ILocalEventEmitter } from "@/app/providers/ILocalEventEmitter";
import { TOKENS } from "@/app/tokens";

/**
 * Controller for handling Razorpay subscription webhooks.
 */
export class HandleSubscriptionWebhookController implements IController {
	constructor(
		@Inject(TOKENS.SubscriptionRepository)
		private readonly subscriptionRepo: IUserSubscriptionRepository,
		@Inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@Inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess,
		@Inject(TOKENS.RazorpayManager)
		private readonly razorpayManager: IRazorpayManager,
		@Inject(TOKENS.LocalEventEmitter)
		private readonly localEventEmitter: ILocalEventEmitter
	) {}

	// Helper function to check if event is relevant

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		const razorpaySignature = httpRequest.headers?.["x-razorpay-signature"];

		try {
			// Verify signature
			if (
				!razorpaySignature ||
				!this.razorpayManager.verifyWebhookSignature(
					JSON.stringify(httpRequest.body),
					razorpaySignature
				)
			) {
				logger.error("Invalid webhook signature");
				error = this.httpErrors.error_400();
				return new HttpResponse(error.statusCode, {
					message: "Invalid webhook signature",
				});
			}

			const event = httpRequest.body;
			logger.debug("Webhook event:", JSON.stringify(event, null, 2));

			const subscription = event.payload?.subscription?.entity;
			if (!subscription || !subscription.id) {
				logger.error("Invalid webhook event: missing subscription entity");
				error = this.httpErrors.error_400();
				return new HttpResponse(error.statusCode, {
					message: "Invalid webhook event",
				});
			}

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
				!this.razorpayManager.isEventRelevant(
					event.event,
					currentSubscription?.status || null,
					eventTimestamp,
					currentSubscription?.updatedAt || null
				)
			) {
				logger.info(
					`Ignoring event ${event.event} for subscription ${subscriptionId} as it has been processed or is in a final state.`
				);
				response = { success: true, data: { message: "Event ignored" } };
				const success = this.httpSuccess.success_200(response.data);
				return new HttpResponse(success.statusCode, success.body);
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

			logger.info(`Subscription ${subscriptionId} status updated to ${status}`);

			// Emit Socket.IO event
			this.localEventEmitter.emit(EventName.SUBSCRIPTION_STATUS_UPDATE, {
				userId: updatedSubscription.userId,
				subscriptionId,
				status,
			});

			response = {
				success: true,
				data: { message: "Webhook processed successfully" },
			};
			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.error("Webhook error:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
