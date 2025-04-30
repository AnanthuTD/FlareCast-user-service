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
import { IUserLogoutUseCase } from "@/app/use-cases/auth/IUserLogoutUseCase";
import { UserLogoutDTO } from "@/domain/dtos/authenticate/UserLogoutDTO";
import { UserLogoutErrorType } from "@/domain/enums/Authenticate/UserLogoutErrorType";

/**
 * Controller for handling user logout requests.
 */
@injectable()
export class UserLogoutController implements IController {
  constructor(
    @inject(TOKENS.UserLogoutUseCase)
    private readonly userLogoutUseCase: IUserLogoutUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    try {
      // Extract the refresh token from cookies
      const refreshToken = httpRequest.cookies?.refreshToken;

      // Create DTO and call the use case
      const dto: UserLogoutDTO = { refreshToken };
      response = await this.userLogoutUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        if (errorType === UserLogoutErrorType.InvalidRefreshToken) {
          error = this.httpErrors.badRequest();
          return new HttpResponse(error.statusCode, {
            message: "Invalid refresh token",
          });
        }
        error = this.httpErrors.internalServerError();
        return new HttpResponse(error.statusCode, {
          message: "Internal server error",
        });
      }

      // Return the response
      const success = this.httpSuccess.ok(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error("Error during user logout:", err);
      error = this.httpErrors.internalServerError();
      return new HttpResponse(error.statusCode, {
        message: "Internal server error",
      });
    }
  }
}