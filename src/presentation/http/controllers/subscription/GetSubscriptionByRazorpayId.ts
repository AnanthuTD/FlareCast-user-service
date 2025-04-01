import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { logger } from "@/infra/logger";
import { TOKENS } from "@/app/tokens";
import { inject, injectable } from "inversify";
import { ResponseMessage } from "@/domain/enums/Messages";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";

/**
 * Controller for verifying Razorpay payments.
 */
@injectable()
export class GetSubscriptionByRazorpayId implements IController {
	constructor(
		@inject(TOKENS.UserSubscriptionRepository)
		private readonly userSubscriptionRepository: IUserSubscriptionRepository,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;

		try {
			// Extract payment details from the request body
			const { razorpaySubscriptionId } = httpRequest.params as {
				razorpaySubscriptionId: string;
			};

			const data = await this.userSubscriptionRepository.findByRazorpaySubscriptionId(
				razorpaySubscriptionId
			);

			// Return the response
			const success = this.httpSuccess.success_200(data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err: any) {
			logger.error("Error verifying payment:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: ResponseMessage.INTERNAL_SERVER_ERROR,
			});
		}
	}
}
