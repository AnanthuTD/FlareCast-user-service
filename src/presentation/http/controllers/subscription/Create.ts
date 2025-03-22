import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { IRazorpayRepository } from "@/app/repositories/IRazorpayRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { Service, Inject } from "typedi";
import env from "@/infra/env";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ISubscriptionRepository } from "@/app/repositories/ISubscriptionRepository";
import { TOKENS } from "@/app/tokens";

/**
 * Controller for subscribing to a plan.
 */
@Service()
export class CreateSubscribeController implements IController {
	constructor(
		@Inject(TOKENS.RazorpayRepository)
		private readonly razorpayRepository: IRazorpayRepository,
		@Inject(TOKENS.UserSubscriptionRepository)
		private readonly userSubscriptionRepository: IUserSubscriptionRepository,
		@Inject(TOKENS.UserRepository)
		private readonly usersRepository: IUsersRepository,
		@Inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@Inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess,
		@Inject(TOKENS.SubscriptionRepository)
		private readonly subscriptionRepository: ISubscriptionRepository
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		if (!httpRequest.user || !httpRequest.user.id) {
			error = this.httpErrors.error_401();
			return new HttpResponse(error.statusCode, { message: "Unauthorized" });
		}

		const userId = httpRequest.user.id;
		const { planId } = httpRequest.body as { planId?: string };

		if (!planId) {
			error = this.httpErrors.error_400();
			return new HttpResponse(error.statusCode, {
				message: "Plan ID is required",
			});
		}

		try {
			const canSubscribeResult = await this.usersRepository.canSubscribe(
				userId
			);
			if (!canSubscribeResult.canSubscribe) {
				error = this.httpErrors.error_400();
				return new HttpResponse(error.statusCode, canSubscribeResult);
			}

			const existingSubscription =
				await this.userSubscriptionRepository.getActiveSubscription(userId);

			if (existingSubscription && existingSubscription.type === "paid") {
				error = this.httpErrors.error_400();
				return new HttpResponse(error.statusCode, {
					message: "User already has an active subscription",
				});
			}

			const subscriptionPlan = await this.subscriptionRepository.findById(
				planId
			);

			if (!subscriptionPlan) {
				error = this.httpErrors.error_404();
				return new HttpResponse(error.statusCode, {
					message: "Subscription plan not found",
				});
			}

			const user = await this.usersRepository.findById(userId);
			if (!user) {
				error = this.httpErrors.error_404();
				return new HttpResponse(error.statusCode, {
					message: "User not found",
				});
			}

			const razorpayResponse = await this.razorpayRepository.subscribe({
				notify_email: user.email.address,
				totalCount: 12,
				planId: subscriptionPlan.planId,
			});

			if (!razorpayResponse || !razorpayResponse.id) {
				error = this.httpErrors.error_500();
				return new HttpResponse(error.statusCode, {
					message: "Failed to create subscription on Razorpay",
				});
			}

			const newSubscription =
				await this.userSubscriptionRepository.createUserSubscription({
					userId,
					razorpayResponse,
					subscriptionPlan,
				});

			response = {
				success: true,
				data: {
					...newSubscription,
					razorpayKeyId: env.RAZORPAY_KEY_ID,
				},
			};
			const success = this.httpSuccess.success_201(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.error("Error creating subscription:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
