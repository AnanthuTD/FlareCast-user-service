import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { Service, Inject } from "typedi";
import env from "@/infra/env";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { TOKENS } from "@/app/tokens";

/**
 * Controller for fetching user subscriptions.
 */
export class GetSubscriptionsController implements IController {
  constructor(
    @Inject(TOKENS.UserSubscriptionRepository)
		private readonly userSubscriptionRepository: IUserSubscriptionRepository,
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
      const subscriptions = await this.userSubscriptionRepository.getUserSubscription(userId);
      const subscriptionsWithKey = subscriptions.map((sub) => ({
        ...sub,
        razorpayKeyId: env.RAZORPAY_KEY_ID,
      }));

      response = {
        success: true,
        data: subscriptionsWithKey,
      };
      const success = this.httpSuccess.success_200(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err) {
      logger.error("Error fetching subscriptions:", err);
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, { message: "Internal server error" });
    }
  }
}