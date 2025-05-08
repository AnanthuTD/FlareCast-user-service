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
import { ResponseMessage } from "@/domain/enums/Messages";

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

			// Create DTO and call the use case
			const dto: CancelSubscriptionDTO = { userId: httpRequest.user.id };
			response = await this.cancelSubscriptionUseCase.execute(dto);

			if (!response.success) {
				const errorType = response.data.error as string;
				switch (errorType) {
					case CancelSubscriptionErrorType.MissingUserId:
						error = this.httpErrors.unauthorized();
						return new HttpResponse(error.statusCode, {
							message: ResponseMessage.UNAUTHORIZED,
						});
					case CancelSubscriptionErrorType.UserNotFound:
						error = this.httpErrors.notFound();
						return new HttpResponse(error.statusCode, {
							message: ResponseMessage.USER_NOT_FOUND,
						});
					case CancelSubscriptionErrorType.FailedToCancelSubscription:
						error = this.httpErrors.internalServerError();
						return new HttpResponse(error.statusCode, {
							message: ResponseMessage.CANCEL_SUBSCRIPTION_FAILED,
						});
					default:
						error = this.httpErrors.internalServerError();
						return new HttpResponse(error.statusCode, {
							message: ResponseMessage.INTERNAL_SERVER_ERROR,
						});
				}
			}

			// Return the response
			const success = this.httpSuccess.ok(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err: any) {
			logger.error("Error canceling subscription:", err);
			error = this.httpErrors.internalServerError();
			return new HttpResponse(error.statusCode, {
				message: ResponseMessage.INTERNAL_SERVER_ERROR,
			});
		}
	}
}
