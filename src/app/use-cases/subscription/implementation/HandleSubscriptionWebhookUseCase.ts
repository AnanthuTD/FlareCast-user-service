import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { IRazorpayManager } from "@/app/providers/IRazorpayManager";
import { ILocalEventEmitter } from "@/app/providers/ILocalEventEmitter";
import { ResponseDTO } from "@/domain/dtos/Response";
import { HandleSubscriptionWebhookDTO } from "@/domain/dtos/subscription/HandleSubscriptionWebhookDTO";
import { HandleSubscriptionWebhookResponseDTO } from "@/domain/dtos/subscription/HandleSubscriptionWebhookResponseDTO";
import { HandleSubscriptionWebhookErrorType } from "@/domain/enums/Subscription/HandleSubscriptionWebhookErrorType";
import { IHandleSubscriptionWebhookUseCase } from "../IHandleSubscriptionWebhookUseCase";
import { logger } from "@/infra/logger";
import EventName from "@/app/event-names";

@injectable()
export class HandleSubscriptionWebhookUseCase implements IHandleSubscriptionWebhookUseCase {
  constructor(
    @inject(TOKENS.SubscriptionRepository)
    private readonly subscriptionRepo: IUserSubscriptionRepository,
    @inject(TOKENS.RazorpayManager)
    private readonly razorpayManager: IRazorpayManager,
    @inject(TOKENS.LocalEventEmitter)
    private readonly localEventEmitter: ILocalEventEmitter
  ) {}

  async execute(dto: HandleSubscriptionWebhookDTO): Promise<ResponseDTO> {
    try {
      // Verify the webhook signature
      if (
        !dto.razorpaySignature ||
        !this.razorpayManager.verifyWebhookSignature(
          JSON.stringify(dto.event),
          dto.razorpaySignature
        )
      ) {
        logger.error("Invalid webhook signature");
        return {
          success: false,
          data: { error: HandleSubscriptionWebhookErrorType.InvalidSignature },
        };
      }

      // Validate the event payload
      const subscription = dto.event.payload?.subscription?.entity;
      if (!subscription || !subscription.id) {
        logger.error("Invalid webhook event: missing subscription entity");
        return {
          success: false,
          data: { error: HandleSubscriptionWebhookErrorType.InvalidEvent },
        };
      }

      const subscriptionId = subscription.id;
      const eventTimestamp = dto.event.created_at;
      const status = subscription.status;
      const startDate = subscription.start_at ? new Date(subscription.start_at * 1000) : null;
      const endDate = subscription.end_at ? new Date(subscription.end_at * 1000) : null;
      const chargeAt = subscription.charge_at ? new Date(subscription.charge_at * 1000) : null;
      const paidCount = subscription.paid_count || 0;
      const currentStart = subscription.current_start
        ? new Date(subscription.current_start * 1000)
        : null;
      const currentEnd = subscription.current_end
        ? new Date(subscription.current_end * 1000)
        : null;

      // Fetch the current subscription state
      const currentSubscription = await this.subscriptionRepo.getUserSubscriptionByRazorpayId(
        subscriptionId
      );

      // Check if the event is relevant
      if (
        !this.razorpayManager.isEventRelevant(
          dto.event.event,
          currentSubscription?.status || null,
          eventTimestamp,
          currentSubscription?.updatedAt || null
        )
      ) {
        logger.info(
          `Ignoring event ${dto.event.event} for subscription ${subscriptionId} as it has been processed or is in a final state.`
        );
        return {
          success: true,
          data: { message: "Event ignored" } as HandleSubscriptionWebhookResponseDTO,
        };
      }

      // Update the subscription
      const updatedSubscription = await this.subscriptionRepo.updateUserSubscription(
        subscriptionId,
        {
          status,
          updatedAt: new Date(eventTimestamp * 1000),
          startDate,
          endDate,
          chargeAt,
          paidCount,
          currentStart,
          currentEnd,
        }
      );

      if (!updatedSubscription) {
        logger.error(`Failed to update subscription ${subscriptionId}`);
        return {
          success: false,
          data: { error: "Failed to update subscription" },
        };
      }

      logger.info(`Subscription ${subscriptionId} status updated to ${status}`);

      // Emit Socket.IO event
      this.localEventEmitter.emit(EventName.SUBSCRIPTION_STATUS_UPDATE, {
        userId: updatedSubscription.userId,
        subscriptionId,
        status,
      });

      return {
        success: true,
        data: { message: "Webhook processed successfully" } as HandleSubscriptionWebhookResponseDTO,
      };
    } catch (err: any) {
      logger.error("Webhook error:", err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}