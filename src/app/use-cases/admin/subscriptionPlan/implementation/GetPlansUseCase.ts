import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { logger } from "@/infra/logger";
import { IGetPlansUseCase } from "../IGetPlansUseCase";
import { ISubscriptionRepository } from "@/app/repositories/ISubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { GetPlansErrorType } from "@/domain/enums/Admin/SubscriptionPlan/GetPlansErrorType";
import { GetPlansResponseDTO } from "@/domain/dtos/admin/subscriptionPlan/GetPlansResponseDTO";

@injectable()
export class GetPlansUseCase implements IGetPlansUseCase {
  constructor(
    @inject(TOKENS.SubscriptionRepository)
    private readonly subscriptionPlanRepository: ISubscriptionRepository
  ) {}

  async execute(): Promise<ResponseDTO & { data: GetPlansResponseDTO | { error: string } }> {
    try {
      const plans = await this.subscriptionPlanRepository.findAll();

      const response: GetPlansResponseDTO = {
        plans,
      };

      logger.info(`Fetched ${plans.length} subscription plans`);
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error("Error fetching subscription plans:", {
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        data: { error: GetPlansErrorType.InternalError },
      };
    }
  }
}