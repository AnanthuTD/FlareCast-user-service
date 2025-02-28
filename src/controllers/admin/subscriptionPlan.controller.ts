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
			videoPerMonth,
			period,
			description,
			duration,
			workspace,
			aiFeature,
		} = req.body;

		console.log(req.body);

		// Validate period
		const validPeriods = Object.values(Period);
		if (!validPeriods.includes(period)) {
			return res.status(400).json({ error: "Invalid period" });
		}

		console.log(period);

		try {
			// Create plan with Razorpay (convert price to paise)
			const razorpayPlan = await this.razorpay.plans.create({
				period,
				interval,
				item: {
					name,
					amount: price * 100, // Convert INR to paise
					currency: "INR",
				},
			});

			// Store in Prisma
			const newPlan = await prisma.subscriptionPlan.create({
				data: {
					planId: razorpayPlan.id,
					name,
					price,
					interval,
					period,
					description,
					duration,
					workspace,
					aiFeature: Boolean(aiFeature),
					isActive: true,
					videoPerMonth: videoPerMonth ?? 0,
				},
			});

			res.status(201).json(newPlan);
		} catch (error) {
			console.error("Failed to create subscription plan:", error);
			res.status(500).json({ error: "Failed to create subscription plan" });
		}
	};

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
				data: { isActive: isActive === undefined ? !plan.isActive : isActive },
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
export const togglePlanController = new SubscriptionPlansController()
	.togglePlanActive;
