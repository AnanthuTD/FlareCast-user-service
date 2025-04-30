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
import { IGetUserProfileUseCase } from "@/app/use-cases/user/IGetUserProfileUseCase";
import { GetUserProfileDTO } from "@/domain/dtos/user/GetUserProfileDTO";
import { GetUserProfileErrorType } from "@/domain/enums/user/GetUserProfileErrorType";
import { ResponseMessage } from "@/domain/enums/Messages";

/**
 * Controller for fetching user profile information.
 */
@injectable()
export class GetUserProfileController implements IController {
  constructor(
    @inject(TOKENS.GetUserProfileUseCase)
    private readonly getUserProfileUseCase: IGetUserProfileUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    try {
      // Create DTO and call the use case
      const dto: GetUserProfileDTO = { userId: httpRequest.user.id };
      response = await this.getUserProfileUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case GetUserProfileErrorType.MissingUserId:
            error = this.httpErrors.unauthorized();
            return new HttpResponse(error.statusCode, { message: ResponseMessage.UNAUTHORIZED });
          case GetUserProfileErrorType.UserNotFound:
            error = this.httpErrors.notFound();
            return new HttpResponse(error.statusCode, { message: ResponseMessage.USER_NOT_FOUND });
          default:
            error = this.httpErrors.internalServerError();
            return new HttpResponse(error.statusCode, {
              message: ResponseMessage.INTERNAL_SERVER_ERROR,
            });
        }
      }

      // Return the response
      const success = this.httpSuccess.ok(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error("Failed to fetch user profile:", err);
      error = this.httpErrors.internalServerError();
      return new HttpResponse(error.statusCode, {
        message: err.message || ResponseMessage.INTERNAL_SERVER_ERROR,
      });
    }
  }
}