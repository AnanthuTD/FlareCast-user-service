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
import { IGetSubscriptionsUseCase } from "@/app/use-cases/subscription/IGetSubscriptionsUseCase";
import { GetSubscriptionsDTO } from "@/domain/dtos/subscription/GetSubscriptionsDTO";
import { GetSubscriptionsErrorType } from "@/domain/enums/Subscription/GetSubscriptionsErrorType";
import { ResponseMessage } from "@/domain/enums/Messages";

/**
 * Controller for fetching user subscriptions.
 */
@injectable()
export class GetSubscriptionsController implements IController {
  constructor(
    @inject(TOKENS.GetSubscriptionsUseCase)
    private readonly getSubscriptionsUseCase: IGetSubscriptionsUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    try {

      // Create DTO and call the use case
      const dto: GetSubscriptionsDTO = { userId: httpRequest.user.id };
      response = await this.getSubscriptionsUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case GetSubscriptionsErrorType.MissingUserId:
            error = this.httpErrors.error_401();
            return new HttpResponse(error.statusCode, { message: errorType });
          case GetSubscriptionsErrorType.FailedToFetchSubscriptions:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, { message: errorType });
          default:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, { message: ResponseMessage.INTERNAL_SERVER_ERROR });
        }
      }

      // Return the response
      const success = this.httpSuccess.success_200(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error("Error fetching subscriptions:", err);
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, { message: ResponseMessage.INTERNAL_SERVER_ERROR });
    }
  }
}