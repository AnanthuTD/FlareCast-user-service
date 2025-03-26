import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { CheckUploadVideoPermissionDTO } from "@/domain/dtos/user/CheckUploadVideoPermissionDTO";
import { CheckUploadVideoPermissionResponseDTO } from "@/domain/dtos/User/CheckUploadVideoPermissionResponseDTO";
import { CheckUploadVideoPermissionErrorType } from "@/domain/enums/user/CheckUploadVideoPermissionErrorType";
import { ICheckUploadVideoPermissionUseCase } from "../ICheckUploadVideoPermissionUseCase";
import { logger } from "@/infra/logger";

@injectable()
export class CheckUploadVideoPermissionUseCase implements ICheckUploadVideoPermissionUseCase {
  constructor(
    @inject(TOKENS.UserSubscriptionRepository)
    private readonly userSubscriptionRepository: IUserSubscriptionRepository,
    @inject(TOKENS.UserRepository)
    private readonly usersRepository: IUsersRepository
  ) {}

  async execute(dto: CheckUploadVideoPermissionDTO): Promise<ResponseDTO> {
    try {
      // Validate user ID
      if (!dto.userId) {
        logger.debug("User ID is required");
        return {
          success: false,
          data: { error: CheckUploadVideoPermissionErrorType.MissingUserId },
        };
      }

      // Fetch the active subscription plan
      const activePlan = await this.userSubscriptionRepository.getActiveSubscription(dto.userId);
      if (!activePlan) {
        logger.debug(`User ${dto.userId} does not have an active subscription plan`);
        return {
          success: false,
          data: { error: CheckUploadVideoPermissionErrorType.NoActiveSubscription },
        };
      }

      // Fetch the current video count
      const currentVideoCount = await this.usersRepository.currentVideoCount(dto.userId);

      // Check if the user has unlimited video uploads
      if (activePlan.maxVideoCount === null || activePlan.maxVideoCount < 0) {
        const response: CheckUploadVideoPermissionResponseDTO = {
          message: "User has unlimited video count",
          permission: "granted",
          maxVideoCount: null,
          totalVideoUploaded: currentVideoCount,
        };
        return {
          success: true,
          data: response,
        };
      }

      // Check if the video limit is exceeded
      if (activePlan.maxVideoCount <= currentVideoCount) {
        const response: CheckUploadVideoPermissionResponseDTO = {
          message: "You've reached your maximum video upload limit",
          permission: "denied",
          maxVideoCount: activePlan.maxVideoCount,
          totalVideoUploaded: currentVideoCount,
        };
        return {
          success: false,
          data: { error: CheckUploadVideoPermissionErrorType.VideoLimitExceeded, details: response },
        };
      }

      // Permission granted
      const response: CheckUploadVideoPermissionResponseDTO = {
        message: "You can upload more videos",
        permission: "granted",
        maxVideoCount: activePlan.maxVideoCount,
        totalVideoUploaded: currentVideoCount,
      };

      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error("Error checking user upload video permission:", err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}