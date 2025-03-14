import { Service, Inject } from "typedi";
import { SubscriptionStatus, UserSubscription } from "@prisma/client"; // Adjust path to your Prisma-generated client
import { User } from "@prisma/client"; // Adjust path to your User model
import { SubscriptionPlan } from "@prisma/client"; // Adjust path to your SubscriptionPlan model
import { EventEmitter } from "events"; // For event emission (if still needed)
import { RazorpayRepository } from "./razorpay.repository";
import prisma from "../prismaClient";
import { Subscriptions } from "razorpay/dist/types/subscriptions";

@Service()
export class UserSubscriptionRepository {
	constructor(
		@Inject()
		private razorpayRepository: RazorpayRepository
	) {
		// Initialize event emitter if needed (commented out if not used)
		// this.eventEmitter = new EventEmitter();
	}

	// Create a user subscription
	createUserSubscription = async ({
		razorpayResponse,
		subscriptionPlan,
		userId,
	}: {
		userId: string;
		razorpayResponse: Subscriptions.RazorpaySubscription;
		subscriptionPlan: SubscriptionPlan;
	}) => {
		const {
			id: razorpaySubscriptionId,
			plan_id: planId,
			status,
			start_at: startDate,
			end_at: endDate,
			remaining_count,
			paid_count: paidCount,
			total_count: totalCount,
			short_url: shortUrl,
			notes,
			current_end,
			current_start,
			charge_at,
		} = razorpayResponse;

		// Map Mongoose status to Prisma enum
		// const mappedStatus = this.mapRazorpayStatusToPrisma(status);

		const newSubscription = await prisma.userSubscription.create({
			data: {
				userId,
				planId: subscriptionPlan.id, // Use Prisma plan ID, not Razorpay planId
				razorpaySubscriptionId,
				status,
				startDate: new Date(startDate * 1000),
				endDate: endDate ? new Date(endDate * 1000) : null,
				remainingCount: parseInt(remaining_count),
				paidCount,
				totalCount,
				amount: subscriptionPlan.price,
				shortUrl,
				notes: notes ? JSON.stringify(notes) : null, // Convert notes to JSON string for Prisma Json
				currentEnd: current_end ? new Date(current_end * 1000) : null,
				currentStart: current_start ? new Date(current_start * 1000) : null,
				chargeAt: new Date(charge_at * 1000),
			},
		});

		console.log("New subscription:", newSubscription);

		// Call addActiveSubscriptionId if status is ACTIVE
		if (newSubscription.status === SubscriptionStatus.active) {
			await this.addActiveSubscriptionId(newSubscription);
		}

		// Emit event (if eventEmitter is needed)
		// this.eventEmitter.emit("subscription:status:update", userId);

		return newSubscription;
	};

	// Get user subscriptions
	getUserSubscription = async (userId: string) => {
		return await prisma.userSubscription.findMany({
			where: { userId },
			orderBy: { createdAt: "desc" }, // Optional: sort by creation date
		});
	};

	getActiveSubscription = async (userId: string) => {
		const activePlan = await prisma.userSubscription.findFirst({
			where: { userId, status: SubscriptionStatus.active },
			orderBy: { createdAt: "desc" },
			select: { plan: true },
		});
		if (!activePlan) {
			return await prisma.subscriptionPlan.findFirst({
				where: { type: "free", isActive: true },
			});
		}
		return activePlan.plan;
	};

	// Update subscription status to ACTIVE
	updateSubscriptionStatusToActive = async (userId: string) => {
		const subscription = await prisma.userSubscription.findFirst({
			where: { userId, status: { not: SubscriptionStatus.active } },
		});

		if (!subscription) {
			throw new Error("No subscription found for user or already active");
		}

		return await prisma.userSubscription.update({
			where: { id: subscription.id },
			data: { status: SubscriptionStatus.active },
		});
	};

	// Subscription status transition rules (same structure as Mongoose)
	SubscriptionStatusOrder = {
		[SubscriptionStatus.created]: [
			SubscriptionStatus.authenticated,
			SubscriptionStatus.pending,
		],
		[SubscriptionStatus.authenticated]: [SubscriptionStatus.active],
		[SubscriptionStatus.active]: [
			SubscriptionStatus.halted,
			SubscriptionStatus.cancelled,
			SubscriptionStatus.paused,
		],
		[SubscriptionStatus.paused]: [SubscriptionStatus.resumed],
		[SubscriptionStatus.resumed]: [SubscriptionStatus.active],
		[SubscriptionStatus.halted]: [SubscriptionStatus.cancelled],
		[SubscriptionStatus.cancelled]: [SubscriptionStatus.completed],
		[SubscriptionStatus.completed]: [],
		[SubscriptionStatus.expired]: [],
		[SubscriptionStatus.charged]: [SubscriptionStatus.active],
	};

	// Update user subscription
	updateUserSubscription = async (
		subscriptionId: string,
		updatedFields: UserSubscription
	) => {
		try {
			const currentSubscription = await prisma.userSubscription.findFirst({
				where: { razorpaySubscriptionId: subscriptionId },
			});

			if (!currentSubscription) {
				throw new Error("Subscription not found.");
			}

			const currentStatus = currentSubscription.status;
			const newStatus = updatedFields.status;

			console.log(
				`Received webhook with intent to update status to: ${newStatus}`
			);

			// Check for redundant updates
			if (currentStatus === newStatus) {
				console.log(
					`Skipping update: Subscription ${subscriptionId} is already in status ${newStatus}.`
				);
				return currentSubscription;
			}

			if (currentStatus === SubscriptionStatus.active) {
				const allowedNextStatuses = this.SubscriptionStatusOrder[currentStatus];
				if (!allowedNextStatuses.includes(newStatus)) {
					console.log(
						`Skipping update: Transition from ${currentStatus} to ${newStatus} is not allowed.`
					);
					return currentSubscription;
				}
			}

			const updatedSubscription = await prisma.userSubscription.update({
				where: { razorpaySubscriptionId: subscriptionId },
				data: {
					...updatedFields,
					updatedAt: new Date(), // Prisma handles this automatically with @updatedAt
				},
			});

			console.log(
				`Subscription ${subscriptionId} status updated to ${newStatus}`
			);

			if (updatedSubscription.status === SubscriptionStatus.active) {
				await this.addActiveSubscriptionId(updatedSubscription);
			}

			// Emit event (if eventEmitter is needed, implement or remove based on usage)
			// Assuming eventEmitter is not used, remove this line or implement EventEmitter
			// this.eventEmitter.emit("subscription:status:update", updatedSubscription.userId);

			return updatedSubscription;
		} catch (error) {
			console.error("Error updating user subscription:", error);
			throw error;
		}
	};

	// Add active subscription ID logic (updated for Prisma and User model)
	addActiveSubscriptionId = async (subscription: UserSubscription) => {
		if (subscription.status === SubscriptionStatus.active) {
			const planData = await prisma.subscriptionPlan.findUnique({
				where: { id: subscription.planId },
			});

			console.log(
				"userId: ",
				subscription.userId,
				"\tActive subscription: ",
				subscription.id
			);

			const result = await prisma.user.update({
				where: { id: subscription.userId },
				data: {
					activeSubscriptionId: subscription.id,
				},
			});

			console.log(result);
		} else {
			// If the status is any other value, reset to default
			const result = await prisma.user.update({
				where: { id: subscription.userId },
				data: {
					activeSubscriptionId: undefined,
				},
			});

			console.log(result);
		}
	};

	// Cancel user subscription
	cancelUserSubscription = async (userId: string) => {
		try {
			const subscription = await prisma.userSubscription.findFirst({
				where: {
					userId,
					status: {
						in: [SubscriptionStatus.authenticated, SubscriptionStatus.active],
					},
				},
			});

			if (!subscription) {
				throw new Error("Subscription not found");
			}

			if (subscription.cancelledAt) {
				return {
					message: `Subscription ${
						subscription.id
					} has already been cancelled (CancelledAt: ${subscription.cancelledAt.toISOString()})`,
					subscriptionStatus: subscription.status,
				};
			}

			if (
				subscription.status !== SubscriptionStatus.active &&
				subscription.status !== SubscriptionStatus.authenticated
			) {
				return {
					message: `Cannot cancel subscription. Current status is '${subscription.status}'. Subscription can only be cancelled if it's in 'active' or 'authenticated' state.`,
					subscriptionStatus: subscription.status,
				};
			}

			const razorpayResponse = await this.razorpayRepository.cancelSubscription(
				subscription.razorpaySubscriptionId
			);

			const updatedSubscription = await prisma.userSubscription.update({
				where: { id: subscription.id },
				data: {
					status: razorpayResponse.status as SubscriptionStatus,
					endDate: razorpayResponse.ended_at
						? new Date(razorpayResponse.ended_at * 1000)
						: new Date(),
					cancelledAt: new Date(),
					remainingCount: 0, // Reset remaining count
				},
			});

			// Emit event (if eventEmitter is needed)
			// this.eventEmitter.emit("subscription:status:update", userId);

			return {
				message: "Subscription cancelled successfully",
				razorpaySubscriptionId: subscription.razorpaySubscriptionId,
				status: razorpayResponse.status,
				subscription: updatedSubscription,
			};
		} catch (error) {
			console.error("Error cancelling subscription:", error);
			throw new Error("Failed to cancel subscription");
		}
	};

	// Helper to map Razorpay status to Prisma enum
	/* private mapRazorpayStatusToPrisma(
		razorpayStatus: string
	): SubscriptionStatus {
		const statusMap: Record<string, SubscriptionStatus> = {
			created: SubscriptionStatus.CREATED,
			authenticated: SubscriptionStatus.AUTHENTICATED,
			active: SubscriptionStatus.ACTIVE,
			pending: SubscriptionStatus.PENDING,
			halted: SubscriptionStatus.HALTED,
			cancelled: SubscriptionStatus.CANCELLED,
			completed: SubscriptionStatus.COMPLETED,
			expired: SubscriptionStatus.EXPIRED,
			paused: SubscriptionStatus.PAUSED,
			resumed: SubscriptionStatus.RESUMED,
			charged: SubscriptionStatus.CHARGED,
		};
		return (
			statusMap[razorpayStatus.toLowerCase()] || SubscriptionStatus.CREATED
		);
	} */

	async getUserSubscriptionByRazorpayId(razorpaySubscriptionId: string) {
		return await prisma.userSubscription.findFirst({
			where: { razorpaySubscriptionId },
			select: { status: true, updatedAt: true, userId: true },
		});
	}
}
