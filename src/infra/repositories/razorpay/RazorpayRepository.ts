import Razorpay from "razorpay";
import crypto from "node:crypto";
import { logger } from "@/infra/logger";
import { IPaymentGateway } from "@/app/repositories/IPaymentGateway";
import { injectable } from "inversify";
import env from "@/infra/env";
import { Orders } from "razorpay/dist/types/orders";

interface CreateRazorpayOrderProps {
	amount: number;
}

interface PaymentVerificationProps {
	razorpayOrderId: string;
	razorpayPaymentId: string;
	razorpaySignature: string;
}

@injectable()
export class RazorpayRepository implements IPaymentGateway {
	private razorPay: Razorpay;

	constructor() {
		this.razorPay = new Razorpay({
			key_id: env.RAZORPAY_KEY_ID,
			key_secret: env.RAZORPAY_SECRET,
		});
	}

	async createOrder({ amount }: CreateRazorpayOrderProps): Promise<any> {
		try {
			const options:
				| Orders.RazorpayOrderCreateRequestBody
				| Orders.RazorpayTransferCreateRequestBody
				| Orders.RazorpayAuthorizationCreateRequestBody = {
				amount: amount * 100, // Convert to paise (Razorpay expects amount in smallest currency unit)
				currency: "INR",
			};

			const razorpayOrder = await this.razorPay.orders.create(options);
			if (!razorpayOrder) {
				throw new Error("Failed to create Razorpay order");
			}

			logger.info(`Created Razorpay order: ${razorpayOrder.id}`);
			return razorpayOrder;
		} catch (error) {
			logger.error("Failed to create Razorpay order:", error);
			throw new Error(`Failed to create Razorpay order: ${error.message}`);
		}
	}

	verifyPayment({
		razorpayOrderId,
		razorpayPaymentId,
		razorpaySignature,
	}: PaymentVerificationProps): boolean {
		try {
			const generatedSignature = `${razorpayPaymentId}|${razorpayOrderId}`;
			const expectedSignature = crypto
				.createHmac("sha256", env.RAZORPAY_SECRET)
				.update(generatedSignature)
				.digest("hex");

			const isValid = expectedSignature === razorpaySignature;
			if (!isValid) {
				logger.warn(
					`Razorpay payment verification failed for order ${razorpayOrderId}`
				);
			}
			return isValid;
		} catch (error) {
			logger.error("Failed to verify Razorpay payment:", error);
			return false;
		}
	}

	async subscribe({
		notify_email,
		planId,
		totalCount,
	}: {
		notify_email: string;
		planId: string;
		totalCount: number;
	}): Promise<any> {
		try {
			const subscription = await this.razorPay.subscriptions.create({
				plan_id: planId,
				total_count: totalCount,
				customer_notify: 1,
				notify_info: {
					notify_email,
				},
			});

			logger.info(`Created Razorpay subscription: ${subscription.id}`);
			return subscription;
		} catch (error) {
			logger.error("Failed to create Razorpay subscription:", error);
			throw new Error(
				`Failed to create Razorpay subscription: ${error.message}`
			);
		}
	}

	async fetchPaymentInfo(paymentId: string): Promise<any> {
		try {
			const paymentDetails = await this.razorPay.payments.fetch(paymentId);
			if (!paymentDetails) {
				throw new Error("Payment not found");
			}

			logger.info(`Fetched payment details for payment ${paymentId}`);
			return paymentDetails;
		} catch (error) {
			logger.error(
				`Failed to fetch payment details for payment ${paymentId}:`,
				error
			);
			throw new Error(`Failed to fetch payment details: ${error.message}`);
		}
	}

	async cancelSubscription(subscriptionId: string): Promise<any> {
		try {
			const response = await this.razorPay.subscriptions.cancel(
				subscriptionId,
				true
			);
			logger.info(`Canceled Razorpay subscription: ${subscriptionId}`);
			return response;
		} catch (error) {
			logger.error(
				`Failed to cancel Razorpay subscription ${subscriptionId}:`,
				error
			);
			throw new Error(
				`Failed to cancel Razorpay subscription: ${error.message}`
			);
		}
	}

	async fetchSubscription(subscriptionId: string): Promise<{
    id: string;
    status: string;
    start_at?: number;
    end_at?: number;
    charge_at?: number;
    paid_count?: number;
    current_start?: number;
    current_end?: number;
  } | null> {
    try {
      const subscription = await this.razorPay.subscriptions.fetch(subscriptionId);
      if (!subscription) {
        logger.debug(`Subscription ${subscriptionId} not found in Razorpay`);
        return null;
      }

      return {
        id: subscription.id,
        status: subscription.status,
        start_at: subscription.start_at,
        end_at: subscription.end_at,
        charge_at: subscription.charge_at,
        paid_count: subscription.paid_count,
        current_start: subscription.current_start,
        current_end: subscription.current_end,
      };
    } catch (err: any) {
      logger.error(`Error fetching subscription ${subscriptionId} from Razorpay:`, err);
      throw err;
    }
  }

	async createPlan(params: {
    period: string;
    interval: number;
    item: {
      name: string;
      amount: number;
      currency: string;
    };
  }): Promise<{
    id: string;
  }> {
    try {
      const plan = await this.razorPay.plans.create(params);
      return { id: plan.id };
    } catch (err: any) {
      logger.error("Error creating Razorpay plan:", {
        message: err.message,
        stack: err.stack,
      });
      throw err;
    }
  }
}
