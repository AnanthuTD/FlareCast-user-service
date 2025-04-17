import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { GetMemberLimitDTO } from "@/domain/dtos/subscription/GetMemberLimitDTO";
import { GetMemberLimitResponseDTO } from "@/domain/dtos/subscription/GetMemberLimitResponseDTO";
import { GetMemberLimitErrorType } from "@/domain/enums/Subscription/GetMemberLimitErrorType";
import { IGetMemberLimitUseCase } from "../IGetMemberLimitUseCase";
import { logger } from "@/infra/logger";

@injectable()
export class GetMemberLimitUseCase implements IGetMemberLimitUseCase {
  constructor(
    @inject(TOKENS.UserSubscriptionRepository)
    private readonly userSubscriptionRepository: IUserSubscriptionRepository
  ) {}

  async execute(dto: GetMemberLimitDTO): Promise<ResponseDTO> {
    try {
      // Validate user ID
      if (!dto.userId) {
        logger.debug("User ID is required");
        return {
          success: false,
          data: { error: GetMemberLimitErrorType.MissingUserId },
        };
      }

      // Fetch the active subscription plan
      const activePlan = await this.userSubscriptionRepository.getActivePlan(dto.userId);
      if (!activePlan) {
        logger.debug(`User ${dto.userId} does not have an active subscription plan`);
        return {
          success: false,
          data: { error: GetMemberLimitErrorType.NoActiveSubscription },
        };
      }

      // Prepare the response
      const response: GetMemberLimitResponseDTO = {
        message: "Member limit",
        limit: activePlan.maxMembers,
      };

      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error("Error getting member limit:", err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}