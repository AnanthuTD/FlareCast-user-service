import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { IRefreshTokenRepository } from "@/app/repositories/IRefreshTokenRepository";
import { IGenerateRefreshTokenProvider } from "@/app/providers/IGenerateRefreshToken";
import { IGenerateAccessTokenProvider } from "@/app/providers/IGenerateAccessToken";
import { ITokenManagerProvider } from "@/app/providers/ITokenManager";
import { ResponseDTO } from "@/domain/dtos/Response";
import { ElectronPostLoginDTO } from "@/domain/dtos/authenticate/ElectronPostLoginDTO";
import { ElectronPostLoginResponseDTO } from "@/domain/dtos/authenticate/ElectronPostLoginResponseDTO";
import { ElectronPostLoginErrorType } from "@/domain/enums/Authenticate/ElectronPostLoginErrorType";
import { IElectronPostLoginUseCase } from "../IElectronPostLoginUseCase";
import { logger } from "@/infra/logger";

@injectable()
export class ElectronPostLoginUseCase implements IElectronPostLoginUseCase {
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

  async execute(dto: ElectronPostLoginDTO): Promise<ResponseDTO> {
    // console.log(dto)
    try {
      // Check if refresh token is provided
      if (!dto.refreshToken) {
        logger.info("No refresh token provided");
        return {
          success: false,
          data: { error: ElectronPostLoginErrorType.MissingRefreshToken },
        };
      }

      // Verify the refresh token
      const isValid = this.tokenManager.validateRefreshToken(dto.refreshToken);
      if (!isValid) {
        logger.info("Invalid refresh token");
        return {
          success: false,
          data: { error: ElectronPostLoginErrorType.InvalidRefreshToken },
        };
      }

      // Check if the refresh token is blacklisted
      const isTokenBlacklisted = await this.refreshTokenRepository.isTokenBlacklisted(dto.refreshToken);
      if (isTokenBlacklisted) {
        logger.info("Refresh token is blacklisted");
        return {
          success: false,
          data: { error: ElectronPostLoginErrorType.RefreshTokenBlacklisted },
        };
      }

      // Extract the payload from the refresh token
      const payload = this.tokenManager.getPayload(dto.refreshToken);
      if (!payload.id) {
        logger.warn("Refresh token payload does not contain user ID:", payload);
        return {
          success: false,
          data: { error: ElectronPostLoginErrorType.InvalidRefreshToken },
        };
      }

      // Fetch the user
      const user = await this.usersRepository.findById(payload.id);
      if (!user || !user.id) {
        logger.info("User not found for refresh token");
        return {
          success: false,
          data: { error: ElectronPostLoginErrorType.UserNotFound },
        };
      }

      // Check if the user is banned
      if (user.isBanned) {
        logger.info("User is banned:", user.id);
        return {
          success: false,
          data: { error: ElectronPostLoginErrorType.UserBanned },
        };
      }

      // Generate new access token
      const accessToken = await this.accessTokenGenerator.generateToken({
        id: user.id,
      });

      // Generate new refresh token (token rotation)
      const newRefreshToken = await this.refreshTokenGenerator.generateToken({
        id: user.id,
      });

      // Prepare the response
      const userResponse: ElectronPostLoginResponseDTO = {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email.address,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
        },
      };

      return {
        success: true,
        data: userResponse,
      };
    } catch (err: any) {
      logger.error("Error during Electron post-login token refresh:", err);
      return {
        success: false,
        data: { error: ElectronPostLoginErrorType.InvalidRefreshToken },
      };
    }
  }
}