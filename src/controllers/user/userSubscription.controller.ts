import { Request, Response, NextFunction, RequestHandler } from "express";
import Container, { Service, Inject } from "typedi";
import { RazorpayRepository } from "../../repositories/razorpay.repository";
import { UserRepository } from "../../repositories/userRepository";
import prisma from "../../prismaClient";
import { User, SubscriptionStatus } from "@prisma/client";
import { UserSubscriptionRepository } from "../../repositories/userSubscription.repository";
import env from "../../env";
import HttpStatusCodes from "../../common/HttpStatusCodes";

@Service()
export class SubscriptionController {
	constructor(
		@Inject()
		private razorpayService: RazorpayRepository,
		@Inject()
		private userRepository: UserRepository,
		@Inject()
		private userSubscriptionRepository: UserSubscriptionRepository
	) {}

	// Check if vendor can subscribe
	canSubscribe: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const { id } = req.user;
			const result = await this.userRepository.canSubscribe(id);

			if (!result.canSubscribe) {
				res.status(HttpStatusCodes.BAD_REQUEST).json(result);
				return;
			}

			res.status(HttpStatusCodes.OK).json({ message: "Vendor can subscribe" });
		} catch (error) {
			console.error("Error checking subscription eligibility:", error);
			res
				.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
				.json({ error: "Internal server error", message: error.message });
		}
	};

	// Subscribe to a plan
	subscribe: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const { planId } = req.body;
			const userId = req.user?.id as string;

			const canSubscribeResult = await this.userRepository.canSubscribe(userId);
			if (!canSubscribeResult.canSubscribe) {
				return res.status(HttpStatusCodes.BAD_REQUEST).json(canSubscribeResult);
			}

			// Check for an existing active subscription
			const existingSubscription = await prisma.userSubscription.findFirst({
				where: { userId: userId, status: SubscriptionStatus.active },
			});

			if (existingSubscription) {
				return res
					.status(HttpStatusCodes.BAD_REQUEST)
					.json({ message: "Vendor already has an active subscription." });
			}

			const subscriptionPlan = await prisma.subscriptionPlan.findUnique({
				where: { planId },
			});

			if (!subscriptionPlan) {
				return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "Subscription plan not found" });
			}

			// TODO: What to do if user already has more videos that the limit

			const user = (await this.userRepository.getUserById(userId)) as User;

			const razorpayResponse = await this.razorpayService.subscribe({
				notify_email: user.email,
				totalCount: 12,
				planId: subscriptionPlan.planId,
			});

			if (!razorpayResponse || !razorpayResponse.id) {
				return res
					.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
					.json({ error: "Failed to create subscription on Razorpay" });
			}

			const newSubscription =
				await this.userSubscriptionRepository.createUserSubscription({
					userId,
					razorpayResponse: razorpayResponse,
					subscriptionPlan,
				});

			return res.status(HttpStatusCodes.CREATED).json({
				...newSubscription,
				razorpayKeyId: env.RAZORPAY_KEY_ID,
			});
		} catch (error) {
			console.error("Error creating subscription:", error);
			return res
				.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
				.json({ error: "Internal server error", message: error.message });
		}
	};

	// Fetch vendor subscriptions
	getSubscriptions: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const userId = req.user?.id as string;
			const subscriptions =
				await this.userSubscriptionRepository.getUserSubscription(userId);

			const subscriptionsWithKey = subscriptions.map((sub) => ({
				...sub,
				razorpayKeyId: env.RAZORPAY_KEY_ID,
			}));

			return res.json(subscriptionsWithKey);
		} catch (error) {
			console.error("Error fetching subscriptions:", error);
			return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
		}
	};

	// Fetch available subscription plans with active status
	getPlans: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const userId = req.user?.id as string;

			const subscriptionPlans = await prisma.subscriptionPlan.findMany();

			if (!subscriptionPlans || subscriptionPlans.length === 0) {
				return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "No subscription plans found" });
			}

			if (userId) {
				const activeSubscription = await prisma.userSubscription.findFirst({
					where: { userId, status: SubscriptionStatus.active },
				});

				const plansWithActiveStatus = subscriptionPlans.map((plan) => ({
					...plan,
					active:
						activeSubscription && activeSubscription.planId === plan.id,
				}));

				return res.json({ plans: plansWithActiveStatus, activeSubscription });
			}
			return res.json({ plans: subscriptionPlans, activeSubscription: null });
		} catch (error) {
			console.error("Error fetching subscription plans:", error);
			return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
		}
	};

	// Cancel a subscription
	cancelSubscription: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const userId = req.user?.id as string;

		try {
			const user = await this.userRepository.getUserById(userId);

			if (!user) {
				return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "User not found" });
			}

			const result =
				await this.userSubscriptionRepository.cancelUserSubscription(userId);

			return res.status(HttpStatusCodes.OK).json({
				message: result.message,
				status: result.status,
				razorpaySubscriptionId: result?.razorpaySubscriptionId,
			});
		} catch (error) {
			console.error("Error cancelling subscription:", error);
			return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
				message: "Failed to cancel subscription",
				error: error.message,
			});
		}
	};
}

export const canSubscribeController = Container.get(
	SubscriptionController
).canSubscribe;
export const subscribeController = Container.get(
	SubscriptionController
).subscribe;
export const getSubscriptionsController = Container.get(
	SubscriptionController
).getSubscriptions;
export const getPlansController = Container.get(
	SubscriptionController
).getPlans;
export const cancelSubscriptionController = Container.get(
	SubscriptionController
).cancelSubscription;
