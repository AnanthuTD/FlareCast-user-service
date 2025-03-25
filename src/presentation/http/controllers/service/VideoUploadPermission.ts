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
import { IUploadVideoPermissionsUseCase } from "@/app/use-cases/video/IUploadVideoPermissionsUseCase";
import { UploadVideoPermissionsDTO } from "@/domain/dtos/video/UploadVideoPermissionsDTO";
import { UploadVideoPermissionsErrorType } from "@/domain/enums/Video/UploadVideoPermissionsErrorType";

/**
 * Controller for checking video upload permissions for a service.
 */
@injectable()
export class UploadVideoPermissionsController implements IController {
  constructor(
    @inject(TOKENS.UploadVideoPermissionsUseCase)
    private readonly uploadVideoPermissionsUseCase: IUploadVideoPermissionsUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    try {
      // Extract user ID from request params
      const userId = httpRequest.params?.userId;

      console.log(httpRequest.params)

      // Create DTO and call the use case
      const dto: UploadVideoPermissionsDTO = { userId };
      response = await this.uploadVideoPermissionsUseCase.execute(dto);

      if (!response.success) {
        const errorData = response.data;
        const errorType = errorData.error as string;
        switch (errorType) {
          case UploadVideoPermissionsErrorType.MissingUserId:
            error = this.httpErrors.error_400();
            return new HttpResponse(error.statusCode, {
              message: "User ID is required",
            });
          case UploadVideoPermissionsErrorType.NoActiveSubscription:
            error = this.httpErrors.error_403();
            return new HttpResponse(error.statusCode, {
              message: "You don't have an active subscription plan",
            });
          case UploadVideoPermissionsErrorType.MaxVideoLimitReached:
            error = this.httpErrors.error_403();
            return new HttpResponse(error.statusCode, {
              message: "You've reached your maximum video upload limit",
              permission: "denied",
              maxVideoCount: errorData.maxVideoCount,
              totalVideoUploaded: errorData.totalVideoUploaded,
            });
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
      logger.error("Error checking service upload video permissions:", err);
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, {
        message: "Internal server error",
      });
    }
  }
}