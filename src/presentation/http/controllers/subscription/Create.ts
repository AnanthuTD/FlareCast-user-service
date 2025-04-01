// backend/src/presentation/http/controllers/subscription/CreateSubscribe.ts
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
import { ICreateSubscribeUseCase } from "@/app/use-cases/subscription/ICreateSubscribeUseCase";
import { CreateSubscribeDTO } from "@/domain/dtos/subscription/CreateSubscribeDTO";
import { CreateSubscribeErrorType } from "@/domain/enums/Subscription/CreateSubscribeErrorType";
import { ResponseMessage } from "@/domain/enums/Messages";

/**
 * Controller for subscribing to a plan.
 */
@injectable()
export class CreateSubscribeController implements IController {
  constructor(
    @inject(TOKENS.CreateSubscribeUseCase)
    private readonly createSubscribeUseCase: ICreateSubscribeUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    try {
      // Extract plan ID from request body
      const { planId } = httpRequest.body as { planId?: string };

      // Create DTO and call the use case
      const dto: CreateSubscribeDTO = {
        userId: httpRequest.user.id,
        planId: planId || "",
      };
      response = await this.createSubscribeUseCase.execute(dto);

      if (!response.success) {
        const errorData = response.data;
        const errorType = errorData.error as string;
        switch (errorType) {
          case CreateSubscribeErrorType.MissingUserId:
            error = this.httpErrors.error_401();
            return new HttpResponse(error.statusCode, { message: ResponseMessage.UNAUTHORIZED });
          case CreateSubscribeErrorType.MissingPlanId:
            error = this.httpErrors.error_400();
            return new HttpResponse(error.statusCode, {
              message: ResponseMessage.PLAN_ID_REQUIRED,
            });
          case CreateSubscribeErrorType.CannotSubscribe:
            error = this.httpErrors.error_400();
            return new HttpResponse(error.statusCode, {
              message: errorData.message,
              canSubscribe: errorData.canSubscribe,
            });
          case CreateSubscribeErrorType.ActiveSubscriptionExists:
            error = this.httpErrors.error_400();
            return new HttpResponse(error.statusCode, {
              message: ResponseMessage.USER_ALREADY_SUBSCRIBED,
            });
          case CreateSubscribeErrorType.SubscriptionPlanNotFound:
            error = this.httpErrors.error_404();
            return new HttpResponse(error.statusCode, {
              message: ResponseMessage.SubscriptionPlanNotFound,
            });
          case CreateSubscribeErrorType.UserNotFound:
            error = this.httpErrors.error_404();
            return new HttpResponse(error.statusCode, {
              message: ResponseMessage.USER_NOT_FOUND,
            });
          case CreateSubscribeErrorType.FailedToCreateRazorpaySubscription:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, {
              message: ResponseMessage.FailedToCreateSubscription,
            });
          case CreateSubscribeErrorType.FailedToCreateUserSubscription:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, {
              message: errorType,
            });
          default:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, {
              message: errorType,
            });
        }
      }

      // Return the response
      const success = this.httpSuccess.success_201(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error("Error creating subscription:", err);
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, {
        message: ResponseMessage.INTERNAL_SERVER_ERROR,
      });
    }
  }
}