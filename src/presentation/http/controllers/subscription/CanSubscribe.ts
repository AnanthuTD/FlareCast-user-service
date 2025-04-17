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
import { ICanSubscribeUseCase } from "@/app/use-cases/subscription/ICanSubscribeUseCase";
import { CanSubscribeDTO } from "@/domain/dtos/subscription/CanSubscribeDTO";
import { CanSubscribeErrorType } from "@/domain/enums/Subscription/CanSubscribeErrorType";
import { ResponseMessage } from "@/domain/enums/Messages";

/**
 * Controller for checking if a user can subscribe.
 */
@injectable()
export class CanSubscribeController implements IController {
  constructor(
    @inject(TOKENS.CanSubscribeUseCase)
    private readonly canSubscribeUseCase: ICanSubscribeUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    try {

      // Create DTO and call the use case
      const dto: CanSubscribeDTO = { userId: httpRequest.user.id };
      response = await this.canSubscribeUseCase.execute(dto);

      if (!response.success) {
        const errorData = response.data;
        const errorType = errorData.error as string;
        switch (errorType) {
          case CanSubscribeErrorType.MissingUserId:
            error = this.httpErrors.error_401();
            return new HttpResponse(error.statusCode, { message: ResponseMessage.UNAUTHORIZED });
          case CanSubscribeErrorType.CannotSubscribe:
            error = this.httpErrors.error_400();
            return new HttpResponse(error.statusCode, {
              message: errorData.message,
              canSubscribe: errorData.canSubscribe,
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
      logger.error("Error checking subscription eligibility:", err);
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, {
        message: ResponseMessage.INTERNAL_SERVER_ERROR,
      });
    }
  }
}