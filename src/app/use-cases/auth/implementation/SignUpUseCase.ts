import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { IGenerateRefreshTokenProvider } from "@/app/providers/IGenerateRefreshToken";
import { IGenerateAccessTokenProvider } from "@/app/providers/IGenerateAccessToken";
import { IEventService } from "@/app/services/IEventService";
import { IPasswordHasher } from "@/app/providers/IPasswordHasher";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { ISignUpUseCase } from "../ISignUpUseCase";
import { SignUpDTO } from "@/domain/dtos/authenticate/SignUpDTO";
import { SignUpErrorType } from "@/domain/enums/Authenticate/SignUpErrorType";
import { SignUpResponseDTO } from "@/domain/dtos/authenticate/SignUpResponseDTO";

@injectable()
export class SignUpUseCase implements ISignUpUseCase {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly usersRepository: IUsersRepository,
    @inject(TOKENS.GenerateRefreshTokenProvider)
    private readonly refreshTokenGenerator: IGenerateRefreshTokenProvider,
    @inject(TOKENS.GenerateAccessTokenProvider)
    private readonly accessTokenGenerator: IGenerateAccessTokenProvider,
    @inject(TOKENS.EventService)
    private readonly eventService: IEventService,
    @inject(TOKENS.PasswordHasher)
    private readonly passwordHasher: IPasswordHasher
  ) {}

  async execute(dto: SignUpDTO): Promise<ResponseDTO> {
    try {
      // Validate required fields
      if (!dto.email || !dto.password || !dto.firstName || !dto.lastName) {
        logger.debug("Missing required fields in sign-up request");
        return {
          success: false,
          data: { error: SignUpErrorType.MissingRequiredFields },
        };
      }

      // Check if user already exists
      const exists = await this.usersRepository.userExists(dto.email);
      if (exists) {
        logger.debug(`User with email ${dto.email} already exists`);
        return {
          success: false,
          data: { error: SignUpErrorType.UserAlreadyExists },
        };
      }

      // Hash the password
      const hashedPassword = await this.passwordHasher.hashPassword(dto.password);

      // Create the user
      const user = await this.usersRepository.create({
        email: dto.email,
        hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        image: dto.image,
        isVerified: false,
      });

      if (!user || !user.id) {
        logger.error("Failed to create user");
        return {
          success: false,
          data: { error: SignUpErrorType.FailedToCreateUser },
        };
      }

      // Publish user created event
      try {
        await this.eventService.publishUserCreatedEvent({
          userId: user.id,
          email: user.email.address,
        });
      } catch (err: any) {
        logger.error("Failed to publish user created event:", err);
        return {
          success: false,
          data: { error: SignUpErrorType.FailedToPublishEvent },
        };
      }

      // Generate access token
      const accessToken = await this.accessTokenGenerator.generateToken({ id: user.id });

      // Generate refresh token
      const refreshToken = await this.refreshTokenGenerator.generateToken({ id: user.id });

      // Prepare the response
      const userResponse: SignUpResponseDTO = {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email.address,
          firstName: user.firstName,
          lastName: user.lastName ?? "",
          image: user.image,
        },
        message: "Verify the email to continue!",
      };

      return {
        success: true,
        data: userResponse,
      };
    } catch (err: any) {
      logger.error("Error during user sign-up:", err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}