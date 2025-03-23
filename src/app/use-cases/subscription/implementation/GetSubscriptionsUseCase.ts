import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { GetSubscriptionsDTO } from "@/domain/dtos/subscription/GetSubscriptionsDTO";
import { GetSubscriptionsResponseDTO } from "@/domain/dtos/subscription/GetSubscriptionsResponseDTO";
import { GetSubscriptionsErrorType } from "@/domain/enums/Subscription/GetSubscriptionsErrorType";
import { IGetSubscriptionsUseCase } from "../IGetSubscriptionsUseCase";
import { logger } from "@/infra/logger";
import env from "@/infra/env";

@injectable()
export class GetSubscriptionsUseCase implements IGetSubscriptionsUseCase {
  constructor(
    @inject(TOKENS.UserSubscriptionRepository)
    private readonly userSubscriptionRepository: IUserSubscriptionRepository
  ) {}

  async execute(dto: GetSubscriptionsDTO): Promise<ResponseDTO> {
    try {
      // Validate user ID
      if (!dto.userId) {
        logger.debug("User ID is required");
        return {
          success: false,
          data: { error: GetSubscriptionsErrorType.MissingUserId },
        };
      }

      // Fetch the user's subscriptions
      const subscriptions = await this.userSubscriptionRepository.getUserSubscription(dto.userId);
      if (!subscriptions) {
        logger.debug(`Failed to fetch subscriptions for user ${dto.userId}`);
        return {
          success: false,
          data: { error: GetSubscriptionsErrorType.FailedToFetchSubscriptions },
        };
      }

      // Map the subscriptions and add the Razorpay key ID
      const subscriptionsWithKey: GetSubscriptionsResponseDTO[] = subscriptions.map((sub) => ({
        ...sub,
        razorpayKeyId: env.RAZORPAY_KEY_ID,
      }));

      return {
        success: true,
        data: subscriptionsWithKey,
      };
    } catch (err: any) {
      logger.error("Error fetching subscriptions:", err);
      return {
        success: false,
        data: { error: GetSubscriptionsErrorType.FailedToFetchSubscriptions },
      };
    }
  }
}