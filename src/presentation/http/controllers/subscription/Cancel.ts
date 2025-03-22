import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { Inject } from "typedi";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { TOKENS } from "@/app/tokens";

/**
 * Controller for canceling a user subscription.
 */
export class CancelSubscriptionController implements IController {
	constructor(
		@Inject(TOKENS.UserSubscriptionRepository)
		private readonly userSubscriptionRepository: IUserSubscriptionRepository,
		@Inject(TOKENS.UserRepository)
		private readonly usersRepository: IUsersRepository,
		@Inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@Inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		if (!httpRequest.user || !httpRequest.user.id) {
			error = this.httpErrors.error_401();
			return new HttpResponse(error.statusCode, { message: "Unauthorized" });
		}

		const userId = httpRequest.user.id;

		try {
			const user = await this.usersRepository.findById(userId);
			if (!user) {
				error = this.httpErrors.error_404();
				return new HttpResponse(error.statusCode, {
					message: "User not found",
				});
			}

			const result =
				await this.userSubscriptionRepository.cancelUserSubscription(userId);

			response = {
				success: true,
				data: {
					message: result.message,
					status: result.status,
					razorpaySubscriptionId: result?.razorpaySubscriptionId,
				},
			};
			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.error("Error cancelling subscription:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Failed to cancel subscription",
			});
		}
	}
}
