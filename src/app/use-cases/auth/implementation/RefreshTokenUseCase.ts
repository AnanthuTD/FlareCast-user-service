import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { IRefreshTokenRepository } from "@/app/repositories/IRefreshTokenRepository";
import { IGenerateRefreshTokenProvider } from "@/app/providers/IGenerateRefreshToken";
import { IGenerateAccessTokenProvider } from "@/app/providers/IGenerateAccessToken";
import { ITokenManagerProvider } from "@/app/providers/ITokenManager";
import { ResponseDTO } from "@/domain/dtos/Response";
import { RefreshTokenDTO } from "@/domain/dtos/authenticate/RefreshTokenDTO";
import { RefreshTokenResponseDTO } from "@/domain/dtos/authenticate/RefreshTokenResponseDTO";
import { RefreshTokenErrorType } from "@/domain/enums/Authenticate/RefreshTokenErrorType";
import { IRefreshTokenUseCase } from "../IRefreshTokenUseCase";
import { logger } from "@/infra/logger";

@injectable()
export class RefreshTokenUseCase implements IRefreshTokenUseCase {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly usersRepository: IUsersRepository,
    @inject(TOKENS.RefreshTokenRepository)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @inject(TOKENS.GenerateRefreshTokenProvider)
    private readonly refreshTokenGenerator: IGenerateRefreshTokenProvider,
    @inject(TOKENS.GenerateAccessTokenProvider)
    private readonly accessTokenGenerator: IGenerateAccessTokenProvider,
    @inject(TOKENS.TokenManagerProvider)
    private readonly tokenManager: ITokenManagerProvider
  ) {}

  async execute(dto: RefreshTokenDTO): Promise<ResponseDTO> {
    try {
      // Check if refreshToken exists
      if (!dto.refreshToken) {
        logger.debug("No refresh token provided");
        return {
          success: false,
          data: { error: RefreshTokenErrorType.MissingRefreshToken },
        };
      }

      // Check if accessToken exists and is still valid
      if (dto.accessToken) {
        const expiresAt = this.tokenManager.getExpiresAt(dto.accessToken);
        const isTokenExpired = this.tokenManager.validateTokenAge(expiresAt);
        if (!isTokenExpired) {
          logger.debug("Access token is still valid");
          const response: RefreshTokenResponseDTO = {
            accessToken: dto.accessToken,
            refreshToken: dto.refreshToken,
            message: "Access token is still valid",
          };
          return {
            success: true,
            data: response,
          };
        }
      }

      // Verify the refresh token
      const isRefreshTokenValid = this.tokenManager.validateRefreshToken(dto.refreshToken);
      if (!isRefreshTokenValid) {
        logger.debug("Invalid refresh token");
        return {
          success: false,
          data: { error: RefreshTokenErrorType.InvalidRefreshToken },
        };
      }

      // Check if the refresh token is blacklisted
      const isBlacklisted = await this.refreshTokenRepository.isTokenBlacklisted(dto.refreshToken);
      if (isBlacklisted) {
        logger.debug("Refresh token is blacklisted");
        return {
          success: false,
          data: { error: RefreshTokenErrorType.RefreshTokenBlacklisted },
        };
      }

      // Extract the payload from the refresh token
      const payload = this.tokenManager.getPayload(dto.refreshToken);
      if (!payload.id) {
        logger.warn("Refresh token payload does not contain user ID:", payload);
        return {
          success: false,
          data: { error: RefreshTokenErrorType.InvalidRefreshToken },
        };
      }

      // Fetch the user
      const user = await this.usersRepository.findById(payload.id);
      if (!user || !user.id) {
        logger.debug(`User with ID ${payload.id} not found`);
        return {
          success: false,
          data: { error: RefreshTokenErrorType.UserNotFound },
        };
      }

      // Check if the user is banned
      if (user.isBanned) {
        logger.debug("User is banned:", user.id);
        return {
          success: false,
          data: { error: RefreshTokenErrorType.UserBanned },
        };
      }

      // Generate new access token
      const newAccessToken = await this.accessTokenGenerator.generateToken({
        id: user.id,
        role: 'user'
      });

      // Generate new refresh token
      const newRefreshToken = await this.refreshTokenGenerator.generateToken({
        id: user.id,
        role: 'user'
      });

      // Prepare the response
      const response: RefreshTokenResponseDTO = {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        message: "Refresh token has been updated",
      };

      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error("Error during refresh token handling:", err);
      return {
        success: false,
        data: { error: RefreshTokenErrorType.InvalidRefreshToken },
      };
    }
  }
}