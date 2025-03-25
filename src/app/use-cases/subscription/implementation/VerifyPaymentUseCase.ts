// backend/src/app/use-cases/subscription/implementation/VerifyPaymentUseCase.ts
import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IPaymentGateway } from "@/app/repositories/IPaymentGateway.ts";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { IUseCase } from "@/app/use-cases/IUseCase";
import { VerifyPaymentDTO } from "@/domain/dtos/subscription/VerifyPaymentDTO";
import { VerifyPaymentResponseDTO } from "@/domain/dtos/subscription/VerifyPaymentResponseDTO";
import { VerifyPaymentErrorType } from "@/domain/enums/Subscription/VerifyPaymentErrorType";
import { logger } from "@/infra/logger";

@injectable()
export class VerifyPaymentUseCase
	implements IUseCase<VerifyPaymentDTO, VerifyPaymentResponseDTO>
{
	constructor(
		@inject(TOKENS.RazorpayRepository)
		private readonly razorpayRepository: IPaymentGateway,
		@inject(TOKENS.UserSubscriptionRepository)
		private readonly subscriptionRepository: IUserSubscriptionRepository
	) {}

	async execute(
		dto: VerifyPaymentDTO
	): Promise<
		ResponseDTO & { data: VerifyPaymentResponseDTO | { error: string } }
	> {
		try {
			// Validate required fields
			if (
				!dto.razorpayPaymentId ||
				!dto.razorpaySubscriptionId ||
				!dto.razorpaySignature
			) {
				logger.debug("Missing required fields for payment verification");
				return {
					success: false,
					data: { error: VerifyPaymentErrorType.MissingRequiredFields },
				};
			}

			// Verify the payment
			const isValid = this.razorpayRepository.verifyPayment({
				razorpayOrderId: dto.razorpaySubscriptionId,
				razorpayPaymentId: dto.razorpayPaymentId,
				razorpaySignature: dto.razorpaySignature,
			});

			if (!isValid) {
				logger.debug(`Invalid payment: ${dto.razorpayPaymentId}`);
				return {
					success: false,
					data: { error: VerifyPaymentErrorType.InvalidPayment },
				};
			}

			// Fetch subscription details from Razorpay
			const subscription = await this.razorpayRepository.fetchSubscription(
				dto.razorpaySubscriptionId
			);
			if (!subscription) {
				logger.debug(
					`Subscription ${dto.razorpaySubscriptionId} not found in Razorpay`
				);
				return {
					success: false,
					data: { error: VerifyPaymentErrorType.InvalidPayment },
				};
			}

			// Extract subscription details
			const subscriptionId = subscription.id;
			const status = subscription.status;
			const startDate = subscription.start_at
				? new Date(subscription.start_at * 1000)
				: null;
			const endDate = subscription.end_at
				? new Date(subscription.end_at * 1000)
				: null;
			const chargeAt = subscription.charge_at
				? new Date(subscription.charge_at * 1000)
				: null;
			const paidCount = subscription.paid_count || 0;
			const currentStart = subscription.current_start
				? new Date(subscription.current_start * 1000)
				: null;
			const currentEnd = subscription.current_end
				? new Date(subscription.current_end * 1000)
				: null;
			const updatedAt = new Date(); // Use current time as the update timestamp

			// Update the subscription in the database
			const updatedSubscription =
				await this.subscriptionRepository.updateUserSubscription(
					subscriptionId,
					{
						status,
						updatedAt,
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
					data: { error: VerifyPaymentErrorType.InternalError },
				};
			}

			logger.info(
				`Subscription ${subscriptionId} updated successfully after payment verification`
			);

			// Prepare the response
			const response: VerifyPaymentResponseDTO = {
				message: "Payment is valid",
			};

			logger.info(`Payment ${dto.razorpayPaymentId} verified successfully`);
			return {
				success: true,
				data: response,
			};
		} catch (err: any) {
			logger.error(`Error verifying payment ${dto.razorpayPaymentId}:`, err);
			return {
				success: false,
				data: { error: VerifyPaymentErrorType.InternalError },
			};
		}
	}
}
