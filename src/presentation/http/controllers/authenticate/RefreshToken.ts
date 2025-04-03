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
import { IRefreshTokenUseCase } from "@/app/use-cases/auth/IRefreshTokenUseCase";
import { RefreshTokenDTO } from "@/domain/dtos/authenticate/RefreshTokenDTO";
import { RefreshTokenErrorType } from "@/domain/enums/Authenticate/RefreshTokenErrorType";

/**
 * Controller for handling refresh token requests.
 */
@injectable()
export class RefreshTokenController implements IController {
  constructor(
    @inject(TOKENS.RefreshTokenUseCase)
    private readonly refreshTokenUseCase: IRefreshTokenUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    // Extract tokens from cookies
    const accessToken = httpRequest.cookies?.accessToken;
    const refreshToken = httpRequest.cookies?.refreshToken;

    try {
      // Create DTO and call the use case
      const dto: RefreshTokenDTO = { accessToken, refreshToken };
      response = await this.refreshTokenUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case RefreshTokenErrorType.MissingRefreshToken:
            error = this.httpErrors.error_401();
            return new HttpResponse(error.statusCode, {
              message: "Unauthorized: No refresh token",
            });
          case RefreshTokenErrorType.InvalidRefreshToken:
            error = this.httpErrors.error_401();
            return new HttpResponse(error.statusCode, {
              message: "Unauthorized: Invalid refresh token",
            });
          case RefreshTokenErrorType.RefreshTokenBlacklisted:
            error = this.httpErrors.error_401();
            return new HttpResponse(error.statusCode, {
              message: "Unauthorized: Refresh token is blacklisted",
            });
          case RefreshTokenErrorType.UserNotFound:
            error = this.httpErrors.error_401();
            return new HttpResponse(error.statusCode, {
              message: "Unauthorized: User not found",
            });
          case RefreshTokenErrorType.UserBanned:
            error = this.httpErrors.error_403();
            return new HttpResponse(error.statusCode, {
              message: "Forbidden: User is banned",
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
      logger.error("Error during refresh token handling:", err);
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, {
        message: "Internal server error",
      });
    }
  }
}