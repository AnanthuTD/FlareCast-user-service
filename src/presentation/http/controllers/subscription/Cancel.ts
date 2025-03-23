import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { TOKENS } from "@/app/tokens";
import { inject, injectable } from "inversify";
import { ICancelSubscriptionUseCase } from "@/app/use-cases/subscription/ICancelSubscriptionUseCase";
import { CancelSubscriptionDTO } from "@/domain/dtos/subscription/CancelSubscriptionDTO";
import { CancelSubscriptionErrorType } from "@/domain/enums/Subscription/CancelSubscriptionErrorType";

/**
 * Controller for canceling a user subscription.
 */
@injectable()
export class CancelSubscriptionController implements IController {
	constructor(
		@inject(TOKENS.CancelSubscriptionUseCase)
		private readonly cancelSubscriptionUseCase: ICancelSubscriptionUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		try {
			// Validate user authentication
			if (!httpRequest.user || !httpRequest.user.id) {
				error = this.httpErrors.error_401();
				return new HttpResponse(error.statusCode, { message: "Unauthorized" });
			}

			// Create DTO and call the use case
			const dto: CancelSubscriptionDTO = { userId: httpRequest.user.id };
			response = await this.cancelSubscriptionUseCase.execute(dto);

			if (!response.success) {
				const errorType = response.data.error as string;
				switch (errorType) {
					case CancelSubscriptionErrorType.MissingUserId:
						error = this.httpErrors.error_401();
						return new HttpResponse(error.statusCode, {
							message: "Unauthorized",
						});
					case CancelSubscriptionErrorType.UserNotFound:
						error = this.httpErrors.error_404();
						return new HttpResponse(error.statusCode, {
							message: "User not found",
						});
					case CancelSubscriptionErrorType.FailedToCancelSubscription:
						error = this.httpErrors.error_500();
						return new HttpResponse(error.statusCode, {
							message: "Failed to cancel subscription",
						});
					default:
						error = this.httpErrors.error_500();
						return new HttpResponse(error.statusCode, {
							message: "Internal server error",
						});
				}
			}

			// Return the response
			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err: any) {
			logger.error("Error canceling subscription:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
