import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { Period } from "@prisma/client";
import { ICreatePlanUseCase } from "../ICreatePlanUseCase";
import { ISubscriptionRepository } from "@/app/repositories/ISubscriptionRepository";
import { CreatePlanResponseDTO } from "@/domain/dtos/admin/subscriptionPlan/CreatePlanResponseDTO";
import { CreatePlanDTO } from "@/domain/dtos/admin/subscriptionPlan/CreatePlanDTO";
import { CreatePlanErrorType } from "@/domain/enums/Admin/SubscriptionPlan/CreatePlanErrorType";
import { IPaymentGateway } from "@/app/repositories/IPaymentGateway";

@injectable()
export class CreatePlanUseCase implements ICreatePlanUseCase {
  constructor(
    @inject(TOKENS.SubscriptionRepository)
    private readonly subscriptionPlanRepository: ISubscriptionRepository,
    @inject(TOKENS.PaymentGateway)
    private readonly paymentGateway: IPaymentGateway
  ) {}

  async execute(
    dto: CreatePlanDTO
  ): Promise<ResponseDTO & { data: CreatePlanResponseDTO | { error: string } }> {
    try {
      // Validate name
      if (!dto.name) {
        logger.debug("Plan name is required");
        return {
          success: false,
          data: { error: CreatePlanErrorType.MissingName },
        };
      }

      let planData: any = {
        type: dto.type || "paid",
        name: dto.name,
        maxRecordingDuration: dto.maxRecordingDuration ? parseInt(String(dto.maxRecordingDuration)) : 1,
        hasAiFeatures: Boolean(dto.hasAiFeatures),
        hasAdvancedEditing: Boolean(dto.hasAdvancedEditing),
        maxMembers: dto.maxMembers ? parseInt(String(dto.maxMembers)) : undefined,
        maxVideoCount: dto.maxVideoCount ? parseInt(String(dto.maxVideoCount)) : 1,
        maxWorkspaces: dto.maxWorkspaces ? parseInt(String(dto.maxWorkspaces)) : undefined,
      };

      if (planData.type === "free") {
        planData.price = 0;
        planData.isActive = dto.isActive !== undefined ? Boolean(dto.isActive) : true;

        const existingActiveFreePlan = await this.subscriptionPlanRepository.findActiveFreePlan();
        if (existingActiveFreePlan && planData.isActive) {
          logger.debug("Another active free plan exists; setting this one to inactive");
          return {
            success: false,
            data: { error: CreatePlanErrorType.ActiveFreePlanExists },
          };
        }
      } else {
        if (!dto.price || !dto.interval || !dto.period) {
          logger.debug("Price, interval, and period are required for paid plans");
          return {
            success: false,
            data: { error: CreatePlanErrorType.MissingPaidPlanFields },
          };
        }

        const validPeriods = Object.values(Period);
        if (!dto.period || !validPeriods.includes(dto.period as Period)) {
          logger.debug(`Invalid period: ${dto.period}`);
          return {
            success: false,
            data: { error: CreatePlanErrorType.InvalidPeriod },
          };
        }

        const razorpayPlan = await this.paymentGateway.createPlan({
          period: dto.period,
          interval: dto.interval,
          item: {
            name: dto.name,
            amount: Math.round(dto.price * 100),
            currency: "INR",
          },
        });

        planData.planId = razorpayPlan.id;
        planData.price = parseFloat(String(dto.price));
        planData.interval = dto.interval;
        planData.period = dto.period;
        planData.isActive = dto.isActive !== undefined ? Boolean(dto.isActive) : true;
      }

      const newPlan = await this.subscriptionPlanRepository.create(planData);

      const response: CreatePlanResponseDTO = {
        plan: newPlan,
      };

      logger.info(`Created subscription plan ${newPlan.id}`);
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error("Error creating subscription plan:", {
        message: err.message,
        stack: err.stack,
      });
      if (err.message.includes("Razorpay")) {
        return {
          success: false,
          data: { error: CreatePlanErrorType.RazorpayError },
        };
      }
      return {
        success: false,
        data: { error: CreatePlanErrorType.InternalError },
      };
    }
  }
}