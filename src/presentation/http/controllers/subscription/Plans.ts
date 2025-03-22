import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { Service, Inject } from "typedi";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ISubscriptionRepository } from "@/app/repositories/ISubscriptionRepository";
import { TOKENS } from "@/app/tokens";

/**
 * Controller for fetching available subscription plans.
 */
export class GetPlansController implements IController {
	constructor(
		@Inject(TOKENS.UserSubscriptionRepository)
		private readonly userSubscriptionRepository: IUserSubscriptionRepository,
		@Inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@Inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess,
		@Inject(TOKENS.SubscriptionRepository)
		private readonly subscriptionRepository: ISubscriptionRepository
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		const userId = httpRequest.user?.id;

		try {
			const subscriptionPlans =
				await this.subscriptionRepository.findAllActivePlans();

			if (!subscriptionPlans || subscriptionPlans.length === 0) {
				error = this.httpErrors.error_404();
				return new HttpResponse(error.statusCode, {
					message: "No subscription plans found",
				});
			}

			if (userId) {
				const activeSubscription =
					await this.userSubscriptionRepository.getActiveSubscription(userId);
				const plansWithActiveStatus = subscriptionPlans.map((plan) => ({
					...plan,
					active: activeSubscription && activeSubscription.planId === plan.id,
				}));

				response = {
					success: true,
					data: {
						plans: plansWithActiveStatus,
						activeSubscription,
					},
				};
			} else {
				response = {
					success: true,
					data: {
						plans: subscriptionPlans,
						activeSubscription: null,
					},
				};
			}

			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.error("Error fetching subscription plans:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
