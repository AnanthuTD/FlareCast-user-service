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
import { ICheckUploadVideoPermissionUseCase } from "@/app/use-cases/user/ICheckUploadVideoPermissionUseCase";
import { CheckUploadVideoPermissionDTO } from "@/domain/dtos/user/CheckUploadVideoPermissionDTO";
import { CheckUploadVideoPermissionErrorType } from "@/domain/enums/user/CheckUploadVideoPermissionErrorType";
import { ResponseMessage } from "@/domain/enums/Messages";

/**
 * Controller for checking video upload permissions for the authenticated user.
 */
@injectable()
export class UploadVideoPermissionController implements IController {
  constructor(
    @inject(TOKENS.CheckUploadVideoPermissionUseCase)
    private readonly checkUploadVideoPermissionUseCase: ICheckUploadVideoPermissionUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    try {
      // Create DTO and call the use case
      const dto: CheckUploadVideoPermissionDTO = { userId: httpRequest.user.id };
      response = await this.checkUploadVideoPermissionUseCase.execute(dto);

      if (!response.success) {
        const errorData = response.data;
        const errorType = errorData.error as string;
        switch (errorType) {
          case CheckUploadVideoPermissionErrorType.MissingUserId:
            error = this.httpErrors.error_401();
            return new HttpResponse(error.statusCode, { message: ResponseMessage.UNAUTHORIZED });
          case CheckUploadVideoPermissionErrorType.NoActiveSubscription:
            error = this.httpErrors.error_403();
            return new HttpResponse(error.statusCode, {
              message: ResponseMessage.NO_ACTIVE_SUBSCRIPTION,
            });
          case CheckUploadVideoPermissionErrorType.VideoLimitExceeded:
            error = this.httpErrors.error_403();
            return new HttpResponse(error.statusCode, errorData.details);
          default:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, { message: ResponseMessage.INTERNAL_SERVER_ERROR });
        }
      }

      // Return the response
      const success = this.httpSuccess.success_200(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error("Error checking user upload video permission:", err);
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, { message: ResponseMessage.INTERNAL_SERVER_ERROR });
    }
  }
}