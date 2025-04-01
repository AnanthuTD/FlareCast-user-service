import {
	SubscriptionStatus,
	UserSubscription,
	SubscriptionPlan,
} from "@prisma/client";
import { Subscriptions } from "razorpay/dist/types/subscriptions";

export interface IUserSubscriptionRepository {
	createUserSubscription(params: {
		userId: string;
		razorpayResponse: Subscriptions.RazorpaySubscription;
		subscriptionPlan: SubscriptionPlan;
	}): Promise<UserSubscription>;

	getUserSubscription(userId: string): Promise<UserSubscription[]>;

	getActivePlan(userId: string): Promise<SubscriptionPlan | null>;
	findSubscription(userId: string): Promise<UserSubscription | null>;

	updateSubscriptionStatusToActive(userId: string): Promise<UserSubscription>;

	updateUserSubscription(
		subscriptionId: string,
		updatedFields: Partial<UserSubscription>
	): Promise<UserSubscription>;

	cancelUserSubscription(userId: string): Promise<{
		message: string;
		razorpaySubscriptionId?: string;
		status?: string;
		subscriptionStatus?: SubscriptionStatus;
		subscription?: UserSubscription;
	}>;

	getUserSubscriptionByRazorpayId(
		razorpaySubscriptionId: string
	): Promise<Pick<UserSubscription, "status" | "updatedAt" | "userId"> | null>;

	getLatestSubscriptions(): Promise<
		Array<
			Pick<UserSubscription, "amount" | "createdAt" | "status"> & {
				plan: Pick<SubscriptionPlan, "name">;
			}
		>
	>;

	activeSubscriptionsCount(): Promise<number>;
	countActiveByPlanId(planId: string): Promise<number>;

	getPaginatedPayments({
		skip,
		take,
		status,
	}: {
		skip: number;
		take: number;
		status?: SubscriptionStatus;
	}): Promise<UserSubscription[]>;

	groupByPlan(): Promise<
		{
			plan: SubscriptionPlan | null;
			count: number;
		}[]
	>;

	freePlanUsage(): Promise<
		{
			plan: SubscriptionPlan | null;
			count: number;
		}[]
	>;

	getStatus(): string[];

	revenueByPeriod(
		period: "daily" | "weekly" | "monthly" | "yearly"
	): Promise<any>;

	statusDistribution(): Promise<any>;

	salesSummary(): Promise<{
		totalRevenue: number;
		totalSubscriptions: number;
		activeUsers: number;
	}>;
}
