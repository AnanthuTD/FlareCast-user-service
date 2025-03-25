import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { IDeletePlanUseCase } from "../IDeletePlanUseCase";
import { DeletePlanDTO } from "@/domain/dtos/admin/subscriptionPlan/DeletePlanDTO";
import { DeletePlanResponseDTO } from "@/domain/dtos/admin/subscriptionPlan/DeletePlanResponseDTO";
import { DeletePlanErrorType } from "@/domain/enums/Admin/SubscriptionPlan/DeletePlanErrorType";
import { ISubscriptionRepository } from "@/app/repositories/ISubscriptionRepository";

@injectable()
export class DeletePlanUseCase implements IDeletePlanUseCase {
  constructor(
    @inject(TOKENS.SubscriptionRepository)
    private readonly subscriptionPlanRepository: ISubscriptionRepository,
    @inject(TOKENS.UserSubscriptionRepository)
    private readonly userSubscriptionRepository: IUserSubscriptionRepository
  ) {}

  async execute(
    dto: DeletePlanDTO
  ): Promise<ResponseDTO & { data: DeletePlanResponseDTO | { error: string } }> {
    try {
      const plan = await this.subscriptionPlanRepository.findById(dto.id);
      if (!plan) {
        logger.debug(`Subscription plan ${dto.id} not found`);
        return {
          success: false,
          data: { error: DeletePlanErrorType.PlanNotFound },
        };
      }

      const activeSubscriptions = await this.userSubscriptionRepository.countActiveByPlanId(dto.id);
      if (activeSubscriptions > 0) {
        logger.debug(`Cannot delete plan ${dto.id} with active subscriptions`);
        return {
          success: false,
          data: { error: DeletePlanErrorType.PlanInUse },
        };
      }

      await this.subscriptionPlanRepository.delete(dto.id);

      const response: DeletePlanResponseDTO = {
        message: "Subscription plan deleted successfully",
      };

      logger.info(`Deleted subscription plan ${dto.id}`);
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error(`Error deleting subscription plan ${dto.id}:`, {
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        data: { error: DeletePlanErrorType.InternalError },
      };
    }
  }
}