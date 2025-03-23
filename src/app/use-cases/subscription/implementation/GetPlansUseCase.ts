import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { ISubscriptionRepository } from "@/app/repositories/ISubscriptionRepository";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { GetPlansDTO } from "@/domain/dtos/subscription/GetPlansDTO";
import { GetPlansResponseDTO, SubscriptionPlanDTO } from "@/domain/dtos/subscription/GetPlansResponseDTO";
import { GetPlansErrorType } from "@/domain/enums/Subscription/GetPlansErrorType";
import { IGetPlansUseCase } from "../IGetPlansUseCase";
import { logger } from "@/infra/logger";

@injectable()
export class GetPlansUseCase implements IGetPlansUseCase {
  constructor(
    @inject(TOKENS.SubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @inject(TOKENS.UserSubscriptionRepository)
    private readonly userSubscriptionRepository: IUserSubscriptionRepository
  ) {}

  async execute(dto: GetPlansDTO): Promise<ResponseDTO> {
    try {
      // Fetch all active subscription plans
      const subscriptionPlans = await this.subscriptionRepository.findAllActivePlans();
      if (!subscriptionPlans || subscriptionPlans.length === 0) {
        logger.debug("No subscription plans found");
        return {
          success: false,
          data: { error: GetPlansErrorType.NoPlansFound },
        };
      }

      // Map subscription plans to DTO
      let plans: SubscriptionPlanDTO[] = subscriptionPlans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        // Add other fields as needed
      }));

      let activeSubscription = null;

      // If a user ID is provided, fetch their active subscription and mark the active plan
      if (dto.userId) {
        activeSubscription = await this.userSubscriptionRepository.getActiveSubscription(dto.userId);
        if (activeSubscription) {
          plans = plans.map((plan) => ({
            ...plan,
            active: plan.id === activeSubscription.planId,
          }));
        }
      }

      const response: GetPlansResponseDTO = {
        plans,
        activeSubscription,
      };

      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error("Error fetching subscription plans:", err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}