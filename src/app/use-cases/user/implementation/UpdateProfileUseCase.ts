import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { IPasswordHasher } from "@/app/providers/IPasswordHasher";
import { IS3Service } from "@/app/services/IS3Service";
import { ResponseDTO } from "@/domain/dtos/Response";
import { UpdateProfileDTO } from "@/domain/dtos/user/UpdateProfileDTO";
import { UpdateProfileResponseDTO } from "@/domain/dtos/User/UpdateProfileResponseDTO";
import { UpdateProfileErrorType } from "@/domain/enums/user/UpdateProfileErrorType";
import { IUpdateProfileUseCase } from "../IUpdateProfileUseCase";
import { logger } from "@/infra/logger";

@injectable()
export class UpdateProfileUseCase implements IUpdateProfileUseCase {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly userRepository: IUsersRepository,
    @inject(TOKENS.PasswordHasher)
    private readonly passwordHasher: IPasswordHasher,
    @inject(TOKENS.S3Service)
    private readonly s3Service: IS3Service
  ) {}

  async execute(dto: UpdateProfileDTO): Promise<ResponseDTO> {
    try {
      // Validate user ID
      if (!dto.userId) {
        logger.debug("User ID is required");
        return {
          success: false,
          data: { error: UpdateProfileErrorType.MissingUserId },
        };
      }

      // Fetch the user
      const user = await this.userRepository.findById(dto.userId);
      if (!user) {
        logger.debug(`User ${dto.userId} not found`);
        return {
          success: false,
          data: { error: UpdateProfileErrorType.UserNotFound },
        };
      }

      // Handle image upload if present
      let updatedImage = user.image ?? undefined;
      if (dto.file) {
        try {
          updatedImage = await this.s3Service.uploadProfileImage(dto.userId, dto.file);
        } catch (err: any) {
          logger.error(`Failed to upload image for user ${dto.userId}:`, err);
          return {
            success: false,
            data: { error: UpdateProfileErrorType.FailedToUploadImage },
          };
        }
      }

      // Hash the password if provided
      let updatedPassword: string | undefined = user.hashedPassword ?? undefined;
      if (dto.password) {
        updatedPassword = await this.passwordHasher.hashPassword(dto.password);
      }

      // Update the user
      const updatedUser = await this.userRepository.update({
        id: dto.userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        hashedPassword: updatedPassword,
        image: updatedImage,
      });

      if (!updatedUser) {
        logger.error(`Failed to update profile for user ${dto.userId}`);
        return {
          success: false,
          data: { error: UpdateProfileErrorType.FailedToUpdateProfile },
        };
      }

      // Prepare the response
      const response: UpdateProfileResponseDTO = {
        id: updatedUser.id!,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName ?? "",
        image: updatedUser.image ?? "",
      };

      logger.info(`User ${dto.userId} updated profile successfully`);
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error(`Failed to update profile for user ${dto.userId}:`, err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}