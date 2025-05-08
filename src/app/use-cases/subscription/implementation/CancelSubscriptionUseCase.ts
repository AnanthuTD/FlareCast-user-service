import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { CancelSubscriptionDTO } from "@/domain/dtos/subscription/CancelSubscriptionDTO";
import { CancelSubscriptionResponseDTO } from "@/domain/dtos/subscription/CancelSubscriptionResponseDTO";
import { CancelSubscriptionErrorType } from "@/domain/enums/Subscription/CancelSubscriptionErrorType";
import { ICancelSubscriptionUseCase } from "../ICancelSubscriptionUseCase";
import { logger } from "@/infra/logger";

@injectable()
export class CancelSubscriptionUseCase implements ICancelSubscriptionUseCase {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly usersRepository: IUsersRepository,
    @inject(TOKENS.UserSubscriptionRepository)
    private readonly userSubscriptionRepository: IUserSubscriptionRepository
  ) {}

  async execute(dto: CancelSubscriptionDTO): Promise<ResponseDTO> {
    try {
      // Validate user ID
      if (!dto.userId) {
        logger.debug("User ID is required");
        return {
          success: false,
          data: { error: CancelSubscriptionErrorType.MissingUserId },
        };
      }

      // Check if the user exists
      const user = await this.usersRepository.findById(dto.userId);
      if (!user || !user.id) {
        logger.debug(`User with ID ${dto.userId} not found`);
        return {
          success: false,
          data: { error: CancelSubscriptionErrorType.UserNotFound },
        };
      }

      // Cancel the subscription
      const result = await this.userSubscriptionRepository.cancelUserSubscription(dto.userId);
      if (!result || !result.status) {
        logger.error(`Failed to cancel subscription for user ${dto.userId}`);
        return {
          success: false,
          data: { error: CancelSubscriptionErrorType.FailedToCancelSubscription },
        };
      }

      // Prepare the response
      const response: CancelSubscriptionResponseDTO = {
        message: result.message,
        status: result.status,
        razorpaySubscriptionId: result.razorpaySubscriptionId,
      };

      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error("Error canceling subscription:", err);
      return {
        success: false,
        data: { error: CancelSubscriptionErrorType.FailedToCancelSubscription },
      };
    }
  }
}