import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { IGetActiveSubscriptionUseCase } from "../IGetActiveSubscriptionUseCase";

@injectable()
export class GetActiveSubscriptionUseCase implements IGetActiveSubscriptionUseCase {
  constructor(
    @inject(TOKENS.UserSubscriptionRepository)
    private readonly userSubscriptionRepository: IUserSubscriptionRepository
  ) {}

  async execute(userId: string): Promise<ResponseDTO> {
    try {
      const activePlan = await this.userSubscriptionRepository.getActiveSubscription(userId);
      return {
        success: true,
        data: { plan: activePlan },
      };
    } catch (err: any) {
      logger.error("Error fetching active subscription:", err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}