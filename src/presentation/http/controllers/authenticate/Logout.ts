import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { Service, Inject } from "typedi";
import { ITokenManagerProvider } from "@/app/providers/ITokenManager";
import { TOKENS } from "@/app/tokens";
import { IRefreshTokenRepository } from "@/app/repositories/IRefreshTokenRepository";

/**
 * Controller for handling user logout requests.
 */
export class UserLogoutController implements IController {

  constructor(
    @Inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors ,
    @Inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess,
    @Inject(TOKENS.RefreshTokenRepository) private readonly refreshTokenRepository: IRefreshTokenRepository,
    @Inject(TOKENS.TokenManagerProvider) private readonly tokenManager: ITokenManagerProvider,
  ) {
    
  }

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    const refreshToken = httpRequest.cookies?.refreshToken;

    try {
      // If a refresh token is present, delete it from the database
      if (refreshToken) {
        const expiresAt = this.tokenManager.getExpiresAt(refreshToken)
        await this.refreshTokenRepository.blacklistToken(refreshToken, expiresAt);
      } else {
        logger.debug("No refresh token found in cookies during logout");
      }

      response = {
        success: true,
        data: {
          message: "Logged out successfully",
        },
      };
      const success = this.httpSuccess.success_200(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err) {
      logger.error("Error during user logout:", err);
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, { message: "Internal server error" });
    }
  }
}