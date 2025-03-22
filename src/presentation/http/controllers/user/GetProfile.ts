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
 * Controller for fetching user profile information.
 */
export class GetUserProfileController implements IController {

	constructor(
		@Inject(TOKENS.UserRepository) private readonly usersRepository: IUsersRepository,
		@Inject(TOKENS.UserSubscriptionRepository) private readonly userSubscriptionRepository: IUserSubscriptionRepository,
		@Inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@Inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {
	}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		// Ensure user is authenticated
		if (!httpRequest.user || !httpRequest.user.id) {
			error = this.httpErrors.error_401();
			return new HttpResponse(error.statusCode, { message: "Unauthorized" });
		}

		const userId = httpRequest.user.id;

		try {
			// Fetch user data
			const user = await this.usersRepository.findById(userId);

			if (!user) {
				error = this.httpErrors.error_404();
				return new HttpResponse(error.statusCode, {
					message: "User not found",
				});
			}

			// Fetch active subscription
			const activeSubscription =
				await this.userSubscriptionRepository.getActiveSubscription(userId);

			response = {
				success: true,
				data: {
					user: {
						id: user.id,
						email: user.email,
						firstName: user.firstName,
						lastName: user.lastName,
						image: user.image,
						plan: activeSubscription,
					},
				},
			};

			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.error("Failed to fetch user profile:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: err.message || "Internal server error",
			});
		}
	}
}
