import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { logger } from "@/infra/logger";
import { ITogglePlanActiveUseCase } from "../ITogglePlanActiveUseCase";
import { TogglePlanActiveDTO } from "@/domain/dtos/admin/subscriptionPlan/TogglePlanActiveDTO";
import { ResponseDTO } from "@/domain/dtos/Response";
import { TogglePlanActiveResponseDTO } from "@/domain/dtos/admin/subscriptionPlan/TogglePlanActiveResponseDTO";
import { TogglePlanActiveErrorType } from "@/domain/enums/Admin/SubscriptionPlan/TogglePlanActiveErrorType";
import { ISubscriptionRepository } from "@/app/repositories/ISubscriptionRepository";

@injectable()
export class TogglePlanActiveUseCase implements ITogglePlanActiveUseCase {
  constructor(
    @inject(TOKENS.SubscriptionRepository)
    private readonly subscriptionPlanRepository: ISubscriptionRepository
  ) {}

  async execute(
    dto: TogglePlanActiveDTO
  ): Promise<ResponseDTO & { data: TogglePlanActiveResponseDTO | { error: string } }> {
    try {
      const plan = await this.subscriptionPlanRepository.findById(dto.id);
      if (!plan) {
        logger.debug(`Subscription plan ${dto.id} not found`);
        return {
          success: false,
          data: { error: TogglePlanActiveErrorType.PlanNotFound },
        };
      }

      const newIsActive = dto.isActive === undefined ? !plan.isActive : Boolean(dto.isActive);

      if (plan.type === "free" && newIsActive) {
        const existingActiveFreePlan = await this.subscriptionPlanRepository.findActiveFreePlan(dto.id);
        if (existingActiveFreePlan) {
          logger.debug("Another free plan is already active");
          return {
            success: false,
            data: { error: TogglePlanActiveErrorType.ActiveFreePlanExists },
          };
        }
      }

      const updatedPlan = await this.subscriptionPlanRepository.update(dto.id, { isActive: newIsActive });

      const response: TogglePlanActiveResponseDTO = {
        plan: updatedPlan,
      };

      logger.info(`Toggled subscription plan ${dto.id} to isActive: ${newIsActive}`);
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error(`Error toggling subscription plan ${dto.id}:`, {
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        data: { error: TogglePlanActiveErrorType.InternalError },
      };
    }
  }
}