import { Request, Response, NextFunction, RequestHandler } from "express";
import { Service } from "typedi";
import Razorpay from "razorpay";
import env from "../../env";
import prisma from "../../prismaClient";
import { Period, SubscriptionPlan } from "@prisma/client";
import HttpStatusCodes from "../../common/HttpStatusCodes";

@Service()
export class SubscriptionPlansController {
	private razorpay: Razorpay;

	constructor() {
		this.razorpay = new Razorpay({
			key_id: env.RAZORPAY_KEY_ID,
			key_secret: env.RAZORPAY_SECRET,
		});
	}

	// Fetch all subscription plans
	getPlans: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const plans = await prisma.subscriptionPlan.findMany({
				where: { isActive: true }, // Optionally filter for active plans only
				orderBy: { createdAt: "desc" }, // Sort by creation date
			});
			return res.status(HttpStatusCodes.OK).json(plans);
		} catch (error) {
			console.error("Failed to fetch subscription plans:", error);
			return res
				.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
				.json({ error: "Failed to fetch subscription plans" });
		}
	};

	// Create a subscription plan (already updated, included for completeness)
	createPlan: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const {
			type = "paid",
			name,
			price,
			interval,
			period,
			maxRecordingDuration,
			hasAiFeatures,
			hasAdvancedEditing,
			maxMembers,
			maxVideoCount,
			maxWorkspaces,
			isActive,
		}: Partial<SubscriptionPlan> = req.body;

		if (!name) {
			return res
				.status(HttpStatusCodes.BAD_REQUEST)
				.json({ error: "Plan name is required" });
		}

		try {
			let planData: any = {
				type,
				name,
				maxRecordingDuration: maxRecordingDuration
					? parseInt(maxRecordingDuration)
					: 1,
				hasAiFeatures: Boolean(hasAiFeatures),
				hasAdvancedEditing: Boolean(hasAdvancedEditing),
				maxMembers: maxMembers ? parseInt(maxMembers) : undefined,
				maxVideoCount: maxVideoCount ? parseInt(maxVideoCount) : 1,
				maxWorkspaces: maxWorkspaces ? parseInt(maxWorkspaces) : undefined,
			};

			if (type === "free") {
				planData.price = 0;
				planData.isActive = isActive !== undefined ? Boolean(isActive) : true;

				const existingActiveFreePlan = await prisma.subscriptionPlan.findFirst({
					where: { type: "free", isActive: true },
				});

				if (existingActiveFreePlan && planData.isActive) {
					planData.isActive = false;
					console.log(
						"Another active free plan exists; setting this one to inactive."
					);
				}
			} else {
				if (!price || !interval || !period) {
					return res
						.status(HttpStatusCodes.BAD_REQUEST)
						.json({
							error: "Price, interval, and period are required for paid plans",
						});
				}

				const validPeriods = Object.values(Period);
				if (!validPeriods.includes(period)) {
					return res
						.status(HttpStatusCodes.BAD_REQUEST)
						.json({ error: "Invalid period" });
				}

				const razorpayPlan = await this.razorpay.plans.create({
					period,
					interval,
					item: {
						name,
						amount: Math.round(price * 100),
						currency: "INR",
					},
				});

				planData.planId = razorpayPlan.id;
				planData.price = parseFloat(price);
				planData.interval = interval;
				planData.period = period;
				planData.isActive = isActive !== undefined ? Boolean(isActive) : true;
			}

			const newPlan = await prisma.subscriptionPlan.create({
				data: planData,
			});

			return res.status(HttpStatusCodes.CREATED).json(newPlan);
		} catch (error) {
			console.error("Failed to create subscription plan:", error);
			return res
				.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
				.json({ error: "Failed to create subscription plan" });
		}
	};

	// Delete a subscription plan
	deletePlan: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const { id } = req.params; // Use 'id' instead of 'planId' for consistency with Prisma

		try {
			// Check if plan exists
			const plan = await prisma.subscriptionPlan.findUnique({
				where: { id },
			});
			if (!plan) {
				return res
					.status(HttpStatusCodes.NOT_FOUND)
					.json({ error: "Subscription plan not found" });
			}

			// Check if plan is in use by active subscriptions
			const activeSubscriptions = await prisma.userSubscription.count({
				where: { planId: id, status: "active" },
			});
			if (activeSubscriptions > 0) {
				return res
					.status(HttpStatusCodes.BAD_REQUEST)
					.json({ error: "Cannot delete plan with active subscriptions" });
			}

			// Delete the plan from Prisma
			await prisma.subscriptionPlan.delete({
				where: { id },
			});

			// Note: Razorpay doesn't support deleting plans directly; consider marking inactive instead
			// If needed, you could call an external cleanup process here

			return res
				.status(HttpStatusCodes.OK)
				.json({ message: "Subscription plan deleted successfully" });
		} catch (error) {
			console.error("Failed to delete subscription plan:", error);
			return res
				.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
				.json({ error: "Failed to delete subscription plan" });
		}
	};

	// Toggle plan active status
	togglePlanActive: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const { id } = req.params;
		const { isActive } = req.body;

		try {
			const plan = await prisma.subscriptionPlan.findUnique({ where: { id } });
			if (!plan) {
				return res
					.status(HttpStatusCodes.NOT_FOUND)
					.json({ error: "Subscription plan not found" });
			}

			// If activating a free plan, ensure only one free plan is active
			if (
				plan.type === "free" &&
				(isActive === true || (isActive === undefined && !plan.isActive))
			) {
				const existingActiveFreePlan = await prisma.subscriptionPlan.findFirst({
					where: { type: "free", isActive: true, id: { not: id } },
				});
				if (existingActiveFreePlan) {
					return res
						.status(HttpStatusCodes.BAD_REQUEST)
						.json({ error: "Another free plan is already active" });
				}
			}

			const updatedPlan = await prisma.subscriptionPlan.update({
				where: { id },
				data: {
					isActive: isActive === undefined ? !plan.isActive : Boolean(isActive),
				},
			});

			return res.status(HttpStatusCodes.OK).json(updatedPlan);
		} catch (error) {
			console.error("Failed to toggle plan status:", error);
			return res
				.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
				.json({ error: "Failed to toggle plan status" });
		}
	};
}

export const getPlansController = new SubscriptionPlansController().getPlans;
export const createPlanController = new SubscriptionPlansController()
	.createPlan;
export const deletePlanController = new SubscriptionPlansController()
	.deletePlan;
export const togglePlanController = new SubscriptionPlansController()
	.togglePlanActive;
