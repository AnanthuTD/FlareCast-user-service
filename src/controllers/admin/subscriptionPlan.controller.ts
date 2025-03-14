import { Request, Response, NextFunction, RequestHandler } from "express";
import { Service } from "typedi";
import Razorpay from "razorpay";
import env from "../../env";
import prisma from "../../prismaClient";
import { Period, SubscriptionPlan } from "@prisma/client";

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
			res.status(500).json({ error: "Failed to fetch subscription plans" });
		}
	};

	// Create a subscription plan
	createPlan: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const {
			name,
			price,
			interval,
			period,
			maxRecordingDuration,
			hasAiFeatures,
			allowsCustomBranding,
			hasAdvancedEditing,
			maxMembers,
			monthlyVideoQuota,
			maxWorkspaces,
			isActive,
		} = req.body;

		// Validate period
		const validPeriods = Object.values(Period)
		if (!validPeriods.includes(period)) {
			return res.status(400).json({ error: "Invalid period" });
		}

		try {
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

			// Store in Prisma
			const newPlan = await prisma.subscriptionPlan.create({
				data: {
					planId: razorpayPlan.id,
					name,
					price: parseFloat(price), // Ensure price is stored as a float
					interval,
					period,
					maxRecordingDuration: maxRecordingDuration
						? parseInt(maxRecordingDuration)
						: undefined,
					hasAiFeatures: Boolean(hasAiFeatures),
					allowsCustomBranding: Boolean(allowsCustomBranding),
					hasAdvancedEditing: Boolean(hasAdvancedEditing),
					maxMembers: maxMembers ? parseInt(maxMembers) : undefined,
					monthlyVideoQuota: monthlyVideoQuota
						? parseInt(monthlyVideoQuota)
						: undefined,
					maxWorkspaces: maxWorkspaces ? parseInt(maxWorkspaces) : undefined,
					isActive: isActive !== undefined ? Boolean(isActive) : true, // Default to true if not provided
				},
			});

			res.status(201).json(newPlan);
		} catch (error) {
			console.error("Failed to create subscription plan:", error);
			res.status(500).json({ error: "Failed to create subscription plan" });
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
				return res.status(404).json({ error: "Subscription plan not found" });
			}

			// Note: Razorpay doesn't provide a direct API to delete plans, so we just mark it inactive
			// If you need to actually delete it from Razorpay, you might need to handle it manually
			await prisma.subscriptionPlan.delete({
				where: { planId },
			});

			res
				.status(200)
				.json({ message: "Subscription plan deleted successfully" });
		} catch (error) {
			console.error("Failed to delete subscription plan:", error);
			res.status(500).json({ error: "Failed to delete subscription plan" });
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
				return res.status(404).json({ error: "Subscription plan not found" });
			}

			const updatedPlan = await prisma.subscriptionPlan.update({
				where: { id },
				data: {
					isActive: isActive === undefined ? !plan.isActive : Boolean(isActive),
				},
			});

			res.status(200).json(updatedPlan);
		} catch (error) {
			console.error("Failed to toggle plan status:", error);
			res.status(500).json({ error: "Failed to toggle plan status" });
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
