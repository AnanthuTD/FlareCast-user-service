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
import { IGetWorkspaceLimitUseCase } from "@/app/use-cases/subscription/IGetWorkspaceLimitUseCase";
import { GetWorkspaceLimitDTO } from "@/domain/dtos/subscription/GetWorkspaceLimitDTO";
import { GetWorkspaceLimitErrorType } from "@/domain/enums/Subscription/GetWorkspaceLimitErrorType";
import { ResponseMessage } from "@/domain/enums/Messages";

/**
 * Controller for fetching the workspace limit for a user.
 */
@injectable()
export class GetWorkspaceLimitController implements IController {
  constructor(
    @inject(TOKENS.GetWorkspaceLimitUseCase)
    private readonly getWorkspaceLimitUseCase: IGetWorkspaceLimitUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    try {
      // Extract user ID from request params
      const userId = httpRequest.params?.userId;

      // Create DTO and call the use case
      const dto: GetWorkspaceLimitDTO = { userId };
      response = await this.getWorkspaceLimitUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case GetWorkspaceLimitErrorType.MissingUserId:
            error = this.httpErrors.error_400();
            return new HttpResponse(error.statusCode, {
              message: errorType,
            });
          case GetWorkspaceLimitErrorType.NoActiveSubscription:
            error = this.httpErrors.error_403();
            return new HttpResponse(error.statusCode, {
              message: errorType,
            });
          default:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, {
              message: ResponseMessage.INTERNAL_SERVER_ERROR,
            });
        }
      }

      // Return the response
      const success = this.httpSuccess.success_200(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error("Error getting workspace limit:", err);
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, {
        message: ResponseMessage.INTERNAL_SERVER_ERROR,
      });
    }
  }
}