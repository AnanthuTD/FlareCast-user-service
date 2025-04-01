import {
	SubscriptionStatus,
	UserSubscription,
	SubscriptionPlan,
} from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { Subscriptions } from "razorpay/dist/types/subscriptions";
import { logger } from "@/infra/logger";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { TOKENS } from "@/app/tokens";
import { inject, injectable } from "inversify";
import { IPaymentGateway } from "@/app/repositories/IPaymentGateway";

@injectable()
export class UserSubscriptionRepository implements IUserSubscriptionRepository {
	constructor(
		@inject(TOKENS.PaymentGateway)
		private readonly paymentGateway: IPaymentGateway,
		@inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient
	) {}

	async createUserSubscription({
		razorpayResponse,
		subscriptionPlan,
		userId,
	}: {
		userId: string;
		razorpayResponse: Subscriptions.RazorpaySubscription;
		subscriptionPlan: SubscriptionPlan;
	}): Promise<UserSubscription> {
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

		try {
			const newSubscription = await this.prisma.userSubscription.create({
				data: {
					userId,
					planId: subscriptionPlan.id, // Use Prisma plan ID, not Razorpay planId
					razorpaySubscriptionId,
					status: status as SubscriptionStatus,
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

			logger.info(
				`Created user subscription: ${newSubscription.id} for user ${userId}`
			);

			// Call addActiveSubscriptionId if status is ACTIVE
			if (newSubscription.status === SubscriptionStatus.active) {
				await this.addActiveSubscriptionId(newSubscription);
			}

			return newSubscription;
		} catch (error) {
			logger.error(
				`Failed to create user subscription for user ${userId}:`,
				error
			);
			throw new Error(`Failed to create user subscription: ${error.message}`);
		}
	}

	async getUserSubscription(userId: string): Promise<UserSubscription[]> {
		try {
			const subscriptions = await this.prisma.userSubscription.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
			});
			return subscriptions;
		} catch (error) {
			logger.error(`Failed to fetch subscriptions for user ${userId}:`, error);
			throw new Error(`Failed to fetch user subscriptions: ${error.message}`);
		}
	}

	async findSubscription(userId: string): Promise<UserSubscription | null> {
		try {
			const subscription = await this.prisma.userSubscription.findFirst({
				where: { userId, status: SubscriptionStatus.active },
			});
			return subscription;
		} catch (error) {
			logger.error(`Failed to fetch subscription with id ${userId}:`, error);
			throw new Error(`Failed to fetch subscription: ${error.message}`);
		}
	}

	async getActivePlan(userId: string): Promise<SubscriptionPlan | null> {
		try {
			const activeSubscription = await this.prisma.userSubscription.findFirst({
				where: { userId, status: SubscriptionStatus.active },
				orderBy: { createdAt: "desc" },
				select: { plan: true },
			});

			if (!activeSubscription) {
				return await this.prisma.subscriptionPlan.findFirst({
					where: { type: "free", isActive: true },
				});
			}

			return activeSubscription?.plan;
		} catch (error) {
			logger.error(
				`Failed to fetch active subscription for user ${userId}:`,
				error
			);
			throw new Error(`Failed to fetch active subscription: ${error.message}`);
		}
	}

	async updateSubscriptionStatusToActive(
		userId: string
	): Promise<UserSubscription> {
		try {
			const subscription = await this.prisma.userSubscription.findFirst({
				where: { userId, status: { not: SubscriptionStatus.active } },
			});

			if (!subscription) {
				throw new Error("No subscription found for user or already active");
			}

			const updatedSubscription = await this.prisma.userSubscription.update({
				where: { id: subscription.id },
				data: { status: SubscriptionStatus.active },
			});

			logger.info(
				`Updated subscription ${subscription.id} status to active for user ${userId}`
			);
			return updatedSubscription;
		} catch (error) {
			logger.error(
				`Failed to update subscription status to active for user ${userId}:`,
				error
			);
			throw new Error(`Failed to update subscription status: ${error.message}`);
		}
	}

	private SubscriptionStatusOrder: Record<
		SubscriptionStatus,
		SubscriptionStatus[]
	> = {
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

	async updateUserSubscription(
		subscriptionId: string,
		updatedFields: Partial<UserSubscription>
	): Promise<UserSubscription> {
		try {
			const currentSubscription = await this.prisma.userSubscription.findFirst({
				where: { razorpaySubscriptionId: subscriptionId },
			});

			if (!currentSubscription) {
				throw new Error("Subscription not found.");
			}

			const currentStatus = currentSubscription.status;
			const newStatus = updatedFields.status;

			logger.info(
				`Received request to update subscription ${subscriptionId} status to: ${newStatus}`
			);

			// Check for redundant updates
			if (newStatus && currentStatus === newStatus) {
				logger.info(
					`Skipping update: Subscription ${subscriptionId} is already in status ${newStatus}.`
				);
				return currentSubscription;
			}

			if (newStatus && currentStatus === SubscriptionStatus.active) {
				const allowedNextStatuses = this.SubscriptionStatusOrder[currentStatus];
				if (!allowedNextStatuses.includes(newStatus)) {
					logger.info(
						`Skipping update: Transition from ${currentStatus} to ${newStatus} is not allowed.`
					);
					return currentSubscription;
				}
			}

			const updatedSubscription = await this.prisma.userSubscription.update({
				where: { razorpaySubscriptionId: subscriptionId },
				data: {
					...updatedFields,
					updatedAt: new Date(),
				},
			});

			logger.info(
				`Subscription ${subscriptionId} status updated to ${newStatus}`
			);

			if (updatedSubscription.status === SubscriptionStatus.active) {
				await this.addActiveSubscriptionId(updatedSubscription);
			} else if (updatedSubscription.status === SubscriptionStatus.expired) {
				await this.switchToDefaultPlan({ userId: updatedSubscription.userId });
			}

			return updatedSubscription;
		} catch (error) {
			logger.error(
				`Failed to update user subscription ${subscriptionId}:`,
				error
			);
			throw new Error(`Failed to update user subscription: ${error.message}`);
		}
	}

	private async switchToDefaultPlan({
		userId,
	}: {
		userId: string;
	}): Promise<void> {
		try {
			const defaultPlan = await this.prisma.subscriptionPlan.findFirst({
				where: { type: "free", isActive: true },
			});

			if (!defaultPlan) {
				throw new Error("Default subscription plan not found.");
			}

			await this.prisma.user.update({
				where: { id: userId },
				data: {
					activeSubscriptionId: defaultPlan.id,
				},
			});

			logger.info(`User ${userId} switched to default plan: ${defaultPlan.id}`);
		} catch (error) {
			logger.error(`Failed to switch user ${userId} to default plan:`, error);
			throw new Error(`Failed to switch to default plan: ${error.message}`);
		}
	}

	private async addActiveSubscriptionId(
		subscription: UserSubscription
	): Promise<void> {
		try {
			if (subscription.status === SubscriptionStatus.active) {
				const planData = await this.prisma.subscriptionPlan.findUnique({
					where: { id: subscription.planId },
				});

				if (!planData) {
					throw new Error(`Plan ${subscription.planId} not found`);
				}

				logger.info(
					`User ${subscription.userId} - Active subscription: ${subscription.id}`
				);

				await this.prisma.user.update({
					where: { id: subscription.userId },
					data: {
						activeSubscriptionId: subscription.id,
					},
				});
			} else {
				// If the status is any other value, reset to default
				await this.prisma.user.update({
					where: { id: subscription.userId },
					data: {
						activeSubscriptionId: undefined,
					},
				});

				logger.info(
					`Reset active subscription for user ${subscription.userId}`
				);
			}
		} catch (error) {
			logger.error(
				`Failed to update active subscription for user ${subscription.userId}:`,
				error
			);
			throw new Error(`Failed to update active subscription: ${error.message}`);
		}
	}

	async cancelUserSubscription(userId: string): Promise<{
		message: string;
		razorpaySubscriptionId?: string;
		status?: string;
		subscriptionStatus?: SubscriptionStatus;
		subscription?: UserSubscription;
	}> {
		try {
			const subscription = await this.prisma.userSubscription.findFirst({
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

			const razorpayResponse = await this.paymentGateway.cancelSubscription(
				subscription.razorpaySubscriptionId
			);

			const updatedSubscription = await this.prisma.userSubscription.update({
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

			logger.info(
				`Cancelled subscription ${subscription.id} for user ${userId}`
			);

			return {
				message: "Subscription cancelled successfully",
				razorpaySubscriptionId: subscription.razorpaySubscriptionId,
				status: razorpayResponse.status,
				subscription: updatedSubscription,
			};
		} catch (error) {
			logger.error(`Failed to cancel subscription for user ${userId}:`, error);
			throw new Error(`Failed to cancel subscription: ${error.message}`);
		}
	}

	async getUserSubscriptionByRazorpayId(
		razorpaySubscriptionId: string
	): Promise<Pick<UserSubscription, "status" | "updatedAt" | "userId"> | null> {
		try {
			const subscription = await this.prisma.userSubscription.findFirst({
				where: { razorpaySubscriptionId },
				select: { status: true, updatedAt: true, userId: true },
			});
			return subscription;
		} catch (error) {
			logger.error(
				`Failed to fetch subscription by Razorpay ID ${razorpaySubscriptionId}:`,
				error
			);
			throw new Error(`Failed to fetch subscription: ${error.message}`);
		}
	}

	async getLatestSubscriptions(): Promise<
		Array<
			Pick<UserSubscription, "amount" | "createdAt" | "status"> & {
				plan: Pick<SubscriptionPlan, "name">;
			}
		>
	> {
		try {
			const subscriptions = await this.prisma.userSubscription.findMany({
				where: {
					status: "active",
				},
				take: 5,
				select: {
					amount: true,
					plan: {
						select: {
							name: true,
						},
					},
					createdAt: true,
					status: true,
				},
				orderBy: { createdAt: "desc" },
			});
			return subscriptions;
		} catch (error) {
			logger.error("Failed to fetch latest subscriptions:", error);
			throw new Error(`Failed to fetch latest subscriptions: ${error.message}`);
		}
	}

	async activeSubscriptionsCount(): Promise<number> {
		try {
			const count = await this.prisma.userSubscription.count({
				where: { status: "active" },
			});
			return count;
		} catch (error) {
			logger.error("Failed to fetch active subscriptions count:", error);
			throw new Error(
				`Failed to fetch active subscriptions count: ${error.message}`
			);
		}
	}

	async countActiveByPlanId(planId: string): Promise<number> {
		try {
			const count = await this.prisma.userSubscription.count({
				where: { planId, status: "active" },
			});
			return count;
		} catch (err: any) {
			logger.error(`Error counting active subscriptions for plan ${planId}:`, {
				message: err.message,
				stack: err.stack,
			});
			throw err;
		}
	}

	async getPaginatedPayments({
		skip,
		take,
		status,
	}: {
		skip: number;
		take: number;
		status?: SubscriptionStatus;
	}): Promise<UserSubscription[]> {
		console.log(skip, take, status);
		const subscriptions = await this.prisma.userSubscription.findMany({
			where: {
				...(status ? { status } : {}),
			},
			skip,
			take,
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				userId: true,
				planId: true,
				status: true,
				createdAt: true,
				updatedAt: true,
				cancelledAt: true,
				remainingCount: true,
				razorpaySubscriptionId: true,
				amount: true,
				plan: { select: { name: true } },
				user: { select: { email: true } },
			},
		});
		const total = await this.prisma.userSubscription.count();

		return { subscriptions, total };
	}

	getStatus(): string[] {
		return Object.values(SubscriptionStatus);
	}
	async groupByPlan() {
		const subscriptions = await this.prisma.userSubscription.aggregateRaw({
			pipeline: [
				{
					$group: {
						_id: "$planId",
						count: { $sum: 1 },
						totalAmount: { $sum: "$amount" },
					},
				},
				{
					$lookup: {
						from: "SubscriptionPlan",
						localField: "_id",
						foreignField: "_id",
						as: "plan",
					},
				},
				{
					$unwind: {
						path: "$plan",
						preserveNullAndEmptyArrays: true,
					},
				},
				{ $sort: { "plan.price": -1 } }, // Sort by plan price, not amount
				{
					$project: {
						planId: "$_id",
						count: 1,
						totalAmount: 1,
						planName: "$plan.name",
						planPrice: "$plan.price",
						planType: "$plan.type",
					},
				},
			],
		});
		return subscriptions;
	}

	// Free plan usage (your existing method)
	async freePlanUsage() {
		const freePlanUsersCount = await this.prisma.user.count({
			where: {
				OR: [
					{ activeSubscriptionId: null },
					{ activeSubscriptionId: { isSet: false } },
				],
			},
		});

		const freePlan = await this.prisma.subscriptionPlan.findFirst({
			where: { type: "free" },
		});

		return {
			count: freePlanUsersCount,
			plan: freePlan,
		};
	}

	// Total revenue by period
	async revenueByPeriod(period: "daily" | "weekly" | "monthly" | "yearly") {
		const groupBy = {
			daily: { $dayOfYear: "$createdAt" },
			weekly: { $week: "$createdAt" },
			monthly: { $month: "$createdAt" },
			yearly: { $year: "$createdAt" },
		}[period];

		const revenue = await this.prisma.userSubscription.aggregateRaw({
			pipeline: [
				{
					$match: { status: { $in: ["active", "completed", "charged"] } }, // Only paid subscriptions
				},
				{
					$group: {
						_id: { period: groupBy, year: { $year: "$createdAt" } },
						totalRevenue: { $sum: "$amount" },
						subscriptionCount: { $sum: 1 },
					},
				},
				{ $sort: { "_id.year": 1, "_id.period": 1 } },
			],
		});

		if (revenue.length) {
			return revenue.map((item: any) => ({
				period: `${item._id.year}-${item._id.period}`,
				totalRevenue: item.totalRevenue,
				subscriptionCount: item.subscriptionCount,
			}));
		}

		return [];
	}

	// Subscription status distribution
	async statusDistribution() {
		const statusCounts = await this.prisma.userSubscription.aggregateRaw({
			pipeline: [
				{ $group: { _id: "$status", count: { $sum: 1 } } },
				{ $sort: { count: -1 } },
			],
		});
		return statusCounts;
	}

	// Total sales summary
	async salesSummary() {
		const totalRevenue = await this.prisma.userSubscription.aggregate({
			_sum: { amount: true },
			where: { status: { in: ["active", "completed", "charged"] } },
		});

		const totalSubscriptions = await this.prisma.userSubscription.count({
			where: { status: { in: ["active", "completed", "charged"] } },
		});

		const activeUsers = await this.prisma.user.count({
			where: { activeSubscriptionId: { not: null } },
		});

		return {
			totalRevenue: totalRevenue._sum.amount || 0,
			totalSubscriptions,
			activeUsers,
		};
	}
}
