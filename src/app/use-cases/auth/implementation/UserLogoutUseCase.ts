import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IRefreshTokenRepository } from "@/app/repositories/IRefreshTokenRepository";
import { ITokenManagerProvider } from "@/app/providers/ITokenManager";
import { ResponseDTO } from "@/domain/dtos/Response";
import { UserLogoutDTO } from "@/domain/dtos/authenticate/UserLogoutDTO";
import { UserLogoutErrorType } from "@/domain/enums/Authenticate/UserLogoutErrorType";
import { IUserLogoutUseCase } from "../IUserLogoutUseCase";
import { logger } from "@/infra/logger";

@injectable()
export class UserLogoutUseCase implements IUserLogoutUseCase {
  constructor(
    @inject(TOKENS.RefreshTokenRepository)
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    @inject(TOKENS.TokenManagerProvider)
    private readonly tokenManager: ITokenManagerProvider
  ) {}

  async execute(dto: UserLogoutDTO): Promise<ResponseDTO> {
    try {
      // If a refresh token is present, validate and blacklist it
      if (dto.refreshToken) {
        // Validate the refresh token
        const isValidToken = this.tokenManager.validateRefreshToken(dto.refreshToken);
        if (!isValidToken) {
          logger.warn("Invalid refresh token during logout:", dto.refreshToken);
          return {
            success: false,
            data: { error: UserLogoutErrorType.InvalidRefreshToken },
          };
        }

        // Get the expiration time and blacklist the token
        const expiresAt = this.tokenManager.getExpiresAt(dto.refreshToken);
        await this.refreshTokenRepository.blacklistToken(dto.refreshToken, expiresAt);
      } else {
        logger.debug("No refresh token provided during logout");
      }

      return {
        success: true,
        data: {
          message: "Logged out successfully",
        },
      };
    } catch (err: any) {
      logger.error("Error during user logout:", err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}