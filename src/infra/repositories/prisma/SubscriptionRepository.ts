import { ISubscriptionRepository } from "@/app/repositories/ISubscriptionRepository";
import { TOKENS } from "@/app/tokens";
import { logger } from "@/infra/logger";
import { SubscriptionPlan } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { Inject } from "typedi";

export class SubscriptionRepository implements ISubscriptionRepository {
	constructor(
		@Inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient
	) {}

	async findById(id: string): Promise<SubscriptionPlan | null | never> {
		try {
			return this.prisma.subscriptionPlan.findUnique({ where: { id: id } });
		} catch (error) {
			logger.error("Failed to find subscription plan!");
			throw error;
		}
	}

  async findAllActivePlans(): Promise<SubscriptionPlan[]> | never {
    try{
      return this.prisma.subscriptionPlan.findMany({ where: { isActive: true } });
    } catch (error) {
      logger.error("Failed to find active subscription plans!");
      throw error;
    }
  }
}
