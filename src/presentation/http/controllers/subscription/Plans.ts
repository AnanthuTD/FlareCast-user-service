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
import { IGetPlansUseCase } from "@/app/use-cases/subscription/IGetPlansUseCase";
import { GetPlansDTO } from "@/domain/dtos/subscription/GetPlansDTO";
import { GetPlansErrorType } from "@/domain/enums/Subscription/GetPlansErrorType";
import { ResponseMessage } from "@/domain/enums/Messages";

/**
 * Controller for fetching available subscription plans.
 */
@injectable()
export class GetPlansController implements IController {
  constructor(
    @inject(TOKENS.GetPlansUseCase)
    private readonly getPlansUseCase: IGetPlansUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    try {
      // Extract user ID (optional, as the endpoint can be accessed by unauthenticated users)
      const userId = httpRequest.user?.id;

      // Create DTO and call the use case
      const dto: GetPlansDTO = { userId };
      response = await this.getPlansUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case GetPlansErrorType.NoPlansFound:
            error = this.httpErrors.error_404();
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
      logger.error("Error fetching subscription plans:", err);
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, {
        message: ResponseMessage.INTERNAL_SERVER_ERROR,
      });
    }
  }
}