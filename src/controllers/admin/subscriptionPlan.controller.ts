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
			const plans = await prisma.subscriptionPlan.findMany();
			res.json(plans);
		} catch (error) {
			console.error("Failed to fetch subscription plans:", error);
			res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to fetch subscription plans" });
		}
	};

	// Create a subscription plan
	createPlan: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const {
			type = "paid", // Default to "paid" if not provided
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

		// Validate required fields for all plans
		if (!name) {
			return res.status(HttpStatusCodes.BAD_REQUEST).json({ error: "Plan name is required" });
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
				maxVideoCount: maxVideoCount ? parseInt(maxVideoCount) : 1, // Align with model
				maxWorkspaces: maxWorkspaces ? parseInt(maxWorkspaces) : undefined,
			};

			if (type === "free") {
				// Free plan specific logic
				planData.price = 0; // Force price to 0
				planData.isActive = isActive !== undefined ? Boolean(isActive) : true;

				// Check for existing active free plan
				const existingActiveFreePlan = await prisma.subscriptionPlan.findFirst({
					where: {
						type: "free",
						isActive: true,
					},
				});

				if (existingActiveFreePlan && planData.isActive) {
					// If there's already an active free plan, make this one inactive
					planData.isActive = false;
					console.log(
						"Another active free plan exists; setting this one to inactive."
					);
				}
			} else {
				// Paid plan logic
				if (!price || !interval || !period) {
					return res
						.status(HttpStatusCodes.BAD_REQUEST)
						.json({
							error: "Price, interval, and period are required for paid plans",
						});
				}

				const validPeriods = Object.values(Period);
				if (!validPeriods.includes(period)) {
					return res.status(HttpStatusCodes.BAD_REQUEST).json({ error: "Invalid period" });
				}

				// Create plan with Razorpay (convert price to paise)
				const razorpayPlan = await this.razorpay.plans.create({
					period,
					interval,
					item: {
						name,
						amount: Math.round(price * 100), // Convert INR to paise, ensure integer
						currency: "INR",
					},
				});

				planData.planId = razorpayPlan.id;
				planData.price = parseFloat(price);
				planData.interval = interval;
				planData.period = period;
				planData.isActive = isActive !== undefined ? Boolean(isActive) : true;
			}

			// Store in Prisma
			const newPlan = await prisma.subscriptionPlan.create({
				data: planData,
			});

			res.status(HttpStatusCodes.CREATED).json(newPlan);
		} catch (error) {
			console.error("Failed to create subscription plan:", error);
			res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to create subscription plan" });
		}
	};

	// Delete a subscription plan
	deletePlan: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const { planId } = req.params;

		try {
			const plan = await prisma.subscriptionPlan.findUnique({
				where: { planId },
			});
			if (!plan) {
				return res.status(HttpStatusCodes.NOT_FOUND).json({ error: "Subscription plan not found" });
			}

			// Note: Razorpay doesn't provide a direct API to delete plans, so we just mark it inactive
			// If you need to actually delete it from Razorpay, you might need to handle it manually
			await prisma.subscriptionPlan.delete({
				where: { planId },
			});

			res
				.status(HttpStatusCodes.OK)
				.json({ message: "Subscription plan deleted successfully" });
		} catch (error) {
			console.error("Failed to delete subscription plan:", error);
			res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to delete subscription plan" });
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
				return res.status(HttpStatusCodes.NOT_FOUND).json({ error: "Subscription plan not found" });
			}

			const updatedPlan = await prisma.subscriptionPlan.update({
				where: { id },
				data: {
					isActive: isActive === undefined ? !plan.isActive : Boolean(isActive),
				},
			});

			res.status(HttpStatusCodes.OK).json(updatedPlan);
		} catch (error) {
			console.error("Failed to toggle plan status:", error);
			res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to toggle plan status" });
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
