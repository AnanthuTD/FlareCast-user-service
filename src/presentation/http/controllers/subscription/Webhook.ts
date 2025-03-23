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
import { IHandleSubscriptionWebhookUseCase } from "@/app/use-cases/subscription/IHandleSubscriptionWebhookUseCase";
import { HandleSubscriptionWebhookDTO } from "@/domain/dtos/subscription/HandleSubscriptionWebhookDTO";
import { HandleSubscriptionWebhookErrorType } from "@/domain/enums/Subscription/HandleSubscriptionWebhookErrorType";

/**
 * Controller for handling Razorpay subscription webhooks.
 */
@injectable()
export class HandleSubscriptionWebhookController implements IController {
  constructor(
    @inject(TOKENS.HandleSubscriptionWebhookUseCase)
    private readonly handleSubscriptionWebhookUseCase: IHandleSubscriptionWebhookUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    try {
      // Extract the Razorpay signature and event payload
      const razorpaySignature = httpRequest.headers?.["x-razorpay-signature"];
      const event = httpRequest.body;

      logger.debug("Webhook event:", JSON.stringify(event, null, 2));

      // Create DTO and call the use case
      const dto: HandleSubscriptionWebhookDTO = {
        event,
        razorpaySignature: razorpaySignature || "",
      };
      response = await this.handleSubscriptionWebhookUseCase.execute(dto);

      if (!response.success) {
        const errorData = response.data;
        const errorType = errorData.error as string;
        switch (errorType) {
          case HandleSubscriptionWebhookErrorType.InvalidSignature:
            error = this.httpErrors.error_400();
            return new HttpResponse(error.statusCode, {
              message: "Invalid webhook signature",
            });
          case HandleSubscriptionWebhookErrorType.InvalidEvent:
            error = this.httpErrors.error_400();
            return new HttpResponse(error.statusCode, {
              message: "Invalid webhook event",
            });
          case HandleSubscriptionWebhookErrorType.EventNotRelevant:
            response = { success: true, data: { message: "Event ignored" } };
            const successIgnored = this.httpSuccess.success_200(response.data);
            return new HttpResponse(successIgnored.statusCode, successIgnored.body);
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
      logger.error("Webhook error:", err);
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, {
        message: "Internal server error",
      });
    }
  }
}