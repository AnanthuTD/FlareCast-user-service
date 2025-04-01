import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ISubscriptionRepository } from "@/app/repositories/ISubscriptionRepository";
import { IPaymentGateway } from "@/app/repositories/IPaymentGateway.ts";
import { ResponseDTO } from "@/domain/dtos/Response";
import { CreateSubscribeDTO } from "@/domain/dtos/subscription/CreateSubscribeDTO";
import { CreateSubscribeResponseDTO } from "@/domain/dtos/subscription/CreateSubscribeResponseDTO";
import { CreateSubscribeErrorType } from "@/domain/enums/Subscription/CreateSubscribeErrorType";
import { ICreateSubscribeUseCase } from "../ICreateSubscribeUseCase";
import { logger } from "@/infra/logger";
import env from "@/infra/env";

@injectable()
export class CreateSubscribeUseCase implements ICreateSubscribeUseCase {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly usersRepository: IUsersRepository,
    @inject(TOKENS.UserSubscriptionRepository)
    private readonly userSubscriptionRepository: IUserSubscriptionRepository,
    @inject(TOKENS.SubscriptionRepository)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @inject(TOKENS.PaymentGateway)
    private readonly paymentGateway: IPaymentGateway
  ) {}

  async execute(dto: CreateSubscribeDTO): Promise<ResponseDTO> {
    try {
      // Validate user ID
      if (!dto.userId) {
        logger.debug("User ID is required");
        return {
          success: false,
          data: { error: CreateSubscribeErrorType.MissingUserId },
        };
      }

      // Validate plan ID
      if (!dto.planId) {
        logger.debug("Plan ID is required");
        return {
          success: false,
          data: { error: CreateSubscribeErrorType.MissingPlanId },
        };
      }

      // Check if the user can subscribe
      const canSubscribeResult = await this.usersRepository.canSubscribe(dto.userId);
      if (!canSubscribeResult.canSubscribe) {
        logger.debug(`User ${dto.userId} cannot subscribe: ${canSubscribeResult.message}`);
        return {
          success: false,
          data: {
            error: CreateSubscribeErrorType.CannotSubscribe,
            message: canSubscribeResult.message,
            canSubscribe: canSubscribeResult.canSubscribe,
          },
        };
      }

      // Check for an existing active subscription
      const existingSubscription = await this.userSubscriptionRepository.getActivePlan(dto.userId);
      if (existingSubscription && existingSubscription.type === "paid") {
        logger.debug(`User ${dto.userId} already has an active subscription`);
        return {
          success: false,
          data: { error: CreateSubscribeErrorType.ActiveSubscriptionExists },
        };
      }

      // Fetch the subscription plan
      const subscriptionPlan = await this.subscriptionRepository.findById(dto.planId);
      if (!subscriptionPlan) {
        logger.debug(`Subscription plan ${dto.planId} not found`);
        return {
          success: false,
          data: { error: CreateSubscribeErrorType.SubscriptionPlanNotFound },
        };
      }

      // Fetch the user
      const user = await this.usersRepository.findById(dto.userId);
      if (!user || !user.id) {
        logger.debug(`User ${dto.userId} not found`);
        return {
          success: false,
          data: { error: CreateSubscribeErrorType.UserNotFound },
        };
      }

      // Create the subscription on Razorpay
      const razorpayResponse = await this.paymentGateway.subscribe({
        notify_email: user.email.address,
        totalCount: 12,
        planId: subscriptionPlan.planId,
      });
      if (!razorpayResponse || !razorpayResponse.id) {
        logger.error("Failed to create subscription on Razorpay");
        return {
          success: false,
          data: { error: CreateSubscribeErrorType.FailedToCreateRazorpaySubscription },
        };
      }

      // Create the user subscription
      const newSubscription = await this.userSubscriptionRepository.createUserSubscription({
        userId: dto.userId,
        razorpayResponse,
        subscriptionPlan,
      });
      if (!newSubscription) {
        logger.error(`Failed to create user subscription for user ${dto.userId}`);
        return {
          success: false,
          data: { error: CreateSubscribeErrorType.FailedToCreateUserSubscription },
        };
      }

      // Prepare the response
      const response: CreateSubscribeResponseDTO = {
        userId: newSubscription.userId,
        subscriptionId: newSubscription.subscriptionId,
        razorpaySubscriptionId: newSubscription.razorpaySubscriptionId,
        planId: newSubscription.planId,
        status: newSubscription.status,
        razorpayKeyId: env.RAZORPAY_KEY_ID,
      };

      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error("Error creating subscription:", err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}