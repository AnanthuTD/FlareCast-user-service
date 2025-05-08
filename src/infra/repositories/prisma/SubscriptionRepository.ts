import { ISubscriptionRepository } from "@/app/repositories/ISubscriptionRepository";
import { TOKENS } from "@/app/tokens";
import { logger } from "@/infra/logger";
import { SubscriptionPlan } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { inject, injectable } from "inversify";
import { Inject } from "typedi";

@injectable()
export class SubscriptionRepository implements ISubscriptionRepository {
	constructor(
		@inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient
	) {}

	/* async findById(id: string): Promise<SubscriptionPlan | null | never> {
		try {
			return this.prisma.subscriptionPlan.findUnique({ where: { id: id } });
		} catch (error) {
			logger.error("Failed to find subscription plan!");
			throw error;
		}
	} */
	findById(id: string): Promise<SubscriptionPlan | null> {
		try {
			return this.prisma.subscriptionPlan.findUnique({ where: { id: id } });
		} catch (error) {
			logger.error("Failed to find subscription plan!");
			throw error;
		}
	}

	async findAllActivePlans(): Promise<SubscriptionPlan[]> | never {
		try {
			return this.prisma.subscriptionPlan.findMany({
				where: { isActive: true },
			});
		} catch (error) {
			logger.error("Failed to find active subscription plans!");
			throw error;
		}
	}

	async findAll({
		skip = 0,
		limit,
		isActive = true,
	}: {
		skip?: number;
		limit?: number;
		isActive?: boolean;
	}): Promise<Array<SubscriptionPlan>> {
		try {
			const plans = await this.prisma.subscriptionPlan.findMany({
				where: {
					...(isActive !== null ? { isActive } : {}),
				},
				orderBy: { createdAt: "desc" },
				...(limit ? { take: limit } : {}),
				skip,
			});
			return plans;
		} catch (err: any) {
			logger.error("Error fetching subscription plans:", {
				message: err.message,
				stack: err.stack,
			});
			throw err;
		}
	}

	async findActiveFreePlan(
		excludeId?: string
	): Promise<SubscriptionPlan | null> {
		try {
			const plan = await this.prisma.subscriptionPlan.findFirst({
				where: {
					type: "free",
					isActive: true,
					...(excludeId && { id: { not: excludeId } }),
				},
			});
			return plan;
		} catch (err: any) {
			logger.error("Error finding active free plan:", {
				message: err.message,
				stack: err.stack,
			});
			throw err;
		}
	}

	async create(data: any): Promise<SubscriptionPlan> {
		try {
			const newPlan = await this.prisma.subscriptionPlan.create({
				data,
			});
			return newPlan;
		} catch (err: any) {
			logger.error("Error creating subscription plan:", {
				message: err.message,
				stack: err.stack,
			});
			throw err;
		}
	}

	async update(
		id: string,
		data: { isActive: boolean }
	): Promise<SubscriptionPlan> {
		try {
			const updatedPlan = await this.prisma.subscriptionPlan.update({
				where: { id },
				data,
			});
			return updatedPlan;
		} catch (err: any) {
			logger.error(`Error updating subscription plan ${id}:`, {
				message: err.message,
				stack: err.stack,
			});
			throw err;
		}
	}

	async delete(id: string): Promise<void> {
		try {
			await this.prisma.subscriptionPlan.delete({
				where: { id },
			});
		} catch (err: any) {
			logger.error(`Error deleting subscription plan ${id}:`, {
				message: err.message,
				stack: err.stack,
			});
			throw err;
		}
	}

	async count(query: { isActive: boolean }): Promise<number> {
		try {
			return this.prisma.subscriptionPlan.count({
				where: {
					...(query.isActive !== null ? { isActive: query.isActive } : {}),
				},
			});
		} catch (error) {
			return 0;
		}
	}
}
