import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { GetWorkspaceLimitDTO } from "@/domain/dtos/subscription/GetWorkspaceLimitDTO";
import { GetWorkspaceLimitResponseDTO } from "@/domain/dtos/subscription/GetWorkspaceLimitResponseDTO";
import { GetWorkspaceLimitErrorType } from "@/domain/enums/Subscription/GetWorkspaceLimitErrorType";
import { IGetWorkspaceLimitUseCase } from "../IGetWorkspaceLimitUseCase";
import { logger } from "@/infra/logger";

@injectable()
export class GetWorkspaceLimitUseCase implements IGetWorkspaceLimitUseCase {
  constructor(
    @inject(TOKENS.UserSubscriptionRepository)
    private readonly userSubscriptionRepository: IUserSubscriptionRepository
  ) {}

  async execute(dto: GetWorkspaceLimitDTO): Promise<ResponseDTO> {
    try {
      // Validate user ID
      if (!dto.userId) {
        logger.debug("User ID is required");
        return {
          success: false,
          data: { error: GetWorkspaceLimitErrorType.MissingUserId },
        };
      }

      // Fetch the active subscription plan
      const activePlan = await this.userSubscriptionRepository.getActiveSubscription(dto.userId);
      if (!activePlan) {
        logger.debug(`User ${dto.userId} does not have an active subscription plan`);
        return {
          success: false,
          data: { error: GetWorkspaceLimitErrorType.NoActiveSubscription },
        };
      }

      // Prepare the response
      const response: GetWorkspaceLimitResponseDTO = {
        message: "Workspace limit",
        limit: activePlan.maxWorkspaces,
      };

      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error("Error getting workspace limit:", err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}