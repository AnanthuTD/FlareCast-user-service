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
 * Controller for checking video upload permissions for the authenticated user.
 */
export class UserUploadVideoPermissionController implements IController {
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
			const activePlan =
				await this.userSubscriptionRepository.getActiveSubscription(userId);
			if (!activePlan) {
				error = this.httpErrors.error_403();
				return new HttpResponse(error.statusCode, {
					message: "You don't have an active subscription plan",
				});
			}

			const currentVideoCount = await this.usersRepository.currentVideoCount(
				userId
			);

			if (activePlan.maxVideoCount === null || activePlan.maxVideoCount < 0) {
				response = {
					success: true,
					data: {
						message: "User has unlimited video count",
						permission: "granted",
						maxVideoCount: null,
						totalVideoUploaded: currentVideoCount,
					},
				};
				const success = this.httpSuccess.success_200(response.data);
				return new HttpResponse(success.statusCode, success.body);
			}

			if (activePlan.maxVideoCount <= currentVideoCount) {
				error = this.httpErrors.error_403();
				return new HttpResponse(error.statusCode, {
					message: "You've reached your maximum video upload limit",
					permission: "denied",
					maxVideoCount: activePlan.maxVideoCount,
					totalVideoUploaded: currentVideoCount,
				});
			}

			response = {
				success: true,
				data: {
					message: "You can upload more videos",
					permission: "granted",
					maxVideoCount: activePlan.maxVideoCount,
					totalVideoUploaded: currentVideoCount,
				},
			};
			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.error("Error checking user upload video permission:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
