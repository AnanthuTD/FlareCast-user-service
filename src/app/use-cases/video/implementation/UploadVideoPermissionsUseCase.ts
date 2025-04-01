import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { UploadVideoPermissionsDTO } from "@/domain/dtos/video/UploadVideoPermissionsDTO";
import { UploadVideoPermissionsResponseDTO } from "@/domain/dtos/video/UploadVideoPermissionsResponseDTO";
import { UploadVideoPermissionsErrorType } from "@/domain/enums/Video/UploadVideoPermissionsErrorType";
import { IUploadVideoPermissionsUseCase } from "../IUploadVideoPermissionsUseCase";
import { logger } from "@/infra/logger";

@injectable()
export class UploadVideoPermissionsUseCase implements IUploadVideoPermissionsUseCase {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly usersRepository: IUsersRepository,
    @inject(TOKENS.UserSubscriptionRepository)
    private readonly userSubscriptionRepository: IUserSubscriptionRepository
  ) {}

  async execute(dto: UploadVideoPermissionsDTO): Promise<ResponseDTO> {
    console.log(dto)
    try {
      // Validate user ID
      if (!dto.userId) {
        logger.debug("User ID is required");
        return {
          success: false,
          data: { error: UploadVideoPermissionsErrorType.MissingUserId },
        };
      }

      // Check for an active subscription plan
      const activePlan = await this.userSubscriptionRepository.getActivePlan(dto.userId);
      if (!activePlan) {
        logger.debug(`No active subscription plan for user ${dto.userId}`);
        return {
          success: false,
          data: { error: UploadVideoPermissionsErrorType.NoActiveSubscription },
        };
      }

      // Get the current video count for the user
      const currentVideoCount = await this.usersRepository.currentVideoCount(dto.userId);

      // Check if the plan allows unlimited videos
      if (activePlan.maxVideoCount === null || activePlan.maxVideoCount < 0) {
        const response: UploadVideoPermissionsResponseDTO = {
          message: "User has unlimited video count",
          permission: "granted",
          maxVideoCount: null,
          totalVideoUploaded: currentVideoCount,
          aiFeature: activePlan.hasAiFeatures,
          maxRecordDuration: activePlan.maxRecordingDuration,
        };
        return {
          success: true,
          data: response,
        };
      }

      // Check if the user has reached the maximum video limit
      if (activePlan.maxVideoCount <= currentVideoCount) {
        logger.debug(`User ${dto.userId} has reached the maximum video upload limit`);
        return {
          success: false,
          data: {
            error: UploadVideoPermissionsErrorType.MaxVideoLimitReached,
            maxVideoCount: activePlan.maxVideoCount,
            totalVideoUploaded: currentVideoCount,
          },
        };
      }

      // User can upload more videos
      const response: UploadVideoPermissionsResponseDTO = {
        message: "You can upload more videos",
        permission: "granted",
        maxVideoCount: activePlan.maxVideoCount,
        totalVideoUploaded: currentVideoCount,
        aiFeature: activePlan.hasAiFeatures,
        maxRecordDuration: activePlan.maxRecordingDuration,
      };

      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error("Error checking video upload permissions:", err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}