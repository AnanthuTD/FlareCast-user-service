import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { IGenerateRefreshTokenProvider } from "@/app/providers/IGenerateRefreshToken";
import { IGenerateAccessTokenProvider } from "@/app/providers/IGenerateAccessToken";
import { ResponseDTO } from "@/domain/dtos/Response";
import { UserLoginDTO } from "@/domain/dtos/authenticate/UserLoginDTO";
import { UserLoginResponseDTO } from "@/domain/dtos/authenticate/UserLoginResponseDTO";
import { UserLoginErrorType } from "@/domain/enums/Authenticate/UserLoginErrorType";
import { IUserLoginUseCase } from "../IUserLoginUseCase";
import { IVerifyUserEmailUseCase } from "../IVerifyUserEmailUseCase";
import { IGetActiveSubscriptionUseCase } from "@/app/use-cases/user/IGetActiveSubscriptionUseCase";
import { IPublishUserVerifiedEventUseCase } from "../IPublishUserVerifiedEventUseCase";
import { logger } from "@/infra/logger";
import { User } from "@/domain/entities/User";

@injectable()
export class UserLoginUseCase implements IUserLoginUseCase {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly usersRepository: IUsersRepository,
    @inject(TOKENS.GenerateRefreshTokenProvider)
    private readonly refreshTokenGenerator: IGenerateRefreshTokenProvider,
    @inject(TOKENS.GenerateAccessTokenProvider)
    private readonly accessTokenGenerator: IGenerateAccessTokenProvider,
    @inject(TOKENS.VerifyUserEmailUseCase)
    private readonly verifyUserEmailUseCase: IVerifyUserEmailUseCase,
    @inject(TOKENS.GetActiveSubscriptionUseCase)
    private readonly getActiveSubscriptionUseCase: IGetActiveSubscriptionUseCase,
    @inject(TOKENS.PublishUserVerifiedEventUseCase)
    private readonly publishUserVerifiedEventUseCase: IPublishUserVerifiedEventUseCase
  ) {}

  async execute(dto: UserLoginDTO): Promise<ResponseDTO> {
    try {
      // Fetch the user by ID
      const user = await this.usersRepository.findById(dto.userId);
      if (!user || !user.id) {
        logger.debug(`User with ID ${dto.userId} not found`);
        return {
          success: false,
          data: { error: UserLoginErrorType.UserNotFound },
        };
      }

      // Check if the user is banned
      if (user.isBanned) {
        logger.debug("User is banned:", user.id);
        return {
          success: false,
          data: { error: UserLoginErrorType.UserBanned },
        };
      }

      // Check if the user needs to be verified
      if (!user.isVerified) {
        const verificationResult = await this.verifyUserEmailUseCase.execute(user.id);
        if (!verificationResult.success) {
          return verificationResult;
        }

        // Fetch the active subscription plan
        const subscriptionResult = await this.getActiveSubscriptionUseCase.execute(user.id);
        if (!subscriptionResult.success) {
          return subscriptionResult;
        }

        // Publish user verified event
        const eventResult = await this.publishUserVerifiedEventUseCase.execute({
          userId: user.id,
          email: user.email.address,
          firstName: user.firstName,
          lastName: user.lastName ?? "",
          image: user.image ?? "",
          plan: subscriptionResult.data.plan,
        });
        if (!eventResult.success) {
          return eventResult;
        }
      }

      // Generate access token
      const accessToken = await this.accessTokenGenerator.generateToken({
        id: user.id,
      });

      // Generate refresh token
      const refreshToken = await this.refreshTokenGenerator.generateToken({
        id: user.id,
      });

      // Prepare the user response
      const userResponse: UserLoginResponseDTO = {
        accessToken,
        refreshToken,
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
      logger.error("Error during user login:", err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}