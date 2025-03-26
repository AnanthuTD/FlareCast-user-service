import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IRefreshTokenRepository } from "@/app/repositories/IRefreshTokenRepository";
import { IGenerateRefreshTokenProvider } from "@/app/providers/IGenerateRefreshToken";
import { IGenerateAccessTokenProvider } from "@/app/providers/IGenerateAccessToken";
import { ITokenManagerProvider } from "@/app/providers/ITokenManager";
import { ResponseDTO } from "@/domain/dtos/Response";
import { RefreshTokenDTO } from "@/domain/dtos/authenticate/RefreshTokenDTO";
import { RefreshTokenResponseDTO } from "@/domain/dtos/authenticate/RefreshTokenResponseDTO";
import { logger } from "@/infra/logger";
import { IAdminRepository } from "@/app/repositories/IAdminRepository";
import { IRefreshTokenUseCase } from "../../auth/IRefreshTokenUseCase";
import { RefreshTokenErrorType } from "@/domain/enums/Admin/Authentication/RefreshTokenErrorType";

@injectable()
export class AdminRefreshTokenUseCase implements IRefreshTokenUseCase {
  constructor(
    @inject(TOKENS.AdminRepository)
    private readonly adminRepository: IAdminRepository,
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
            message: "Access token is still valid",
          };
          return {
            success: true,
            data: response,
          };
        }
      }

      // Verify the refresh token
      const isRefreshTokenValid = this.tokenManager.validateAdminRefreshToken(dto.refreshToken);
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
      const admin = await this.adminRepository.findById(payload.id);
      if (!admin || !admin.id) {
        logger.debug(`Admin with ID ${payload.id} not found`);
        return {
          success: false,
          data: { error: RefreshTokenErrorType.AdminNotFound },
        };
      }

      // Generate new access token
      const newAccessToken = await this.accessTokenGenerator.generateAdminToken({
        id: admin.id,
      });

      // Generate new refresh token
      const newRefreshToken = await this.refreshTokenGenerator.generateAdminToken({
        id: admin.id,
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