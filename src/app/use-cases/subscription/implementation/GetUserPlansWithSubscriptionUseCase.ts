import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { ISubscriptionRepository } from "@/app/repositories/ISubscriptionRepository";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { GetPlansDTO } from "@/domain/dtos/subscription/GetPlansDTO";
import { GetPlansErrorType } from "@/domain/enums/Subscription/GetPlansErrorType";
import { logger } from "@/infra/logger";
import { IGetUserPlansWithSubscriptionUseCase } from "../IGetUserPlansWithSubscriptionUseCase";
import { GetUserPlansWithSubscriptionResponseDTO } from "@/domain/dtos/subscription/GetUserPlansWithSubscriptionResponseDTO";

@injectable()
export class GetUserPlansWithSubscriptionUseCase implements IGetUserPlansWithSubscriptionUseCase {
	constructor(
		@inject(TOKENS.SubscriptionRepository)
		private readonly subscriptionRepository: ISubscriptionRepository,
		@inject(TOKENS.UserSubscriptionRepository)
		private readonly userSubscriptionRepository: IUserSubscriptionRepository
	) {}

	async execute(dto: GetPlansDTO): Promise<ResponseDTO> {
		try {
			// Fetch all active subscription plans
			const subscriptionPlans =
				await this.subscriptionRepository.findAllActivePlans();
			if (!subscriptionPlans || subscriptionPlans.length === 0) {
				logger.debug("No subscription plans found");
				return {
					success: false,
					data: { error: GetPlansErrorType.NoPlansFound },
				};
			}

			const isUnlimited = (value: number | null): string | number => {
				return value === undefined || value === null || value < 0
					? "Unlimited"
					: value;
			};

			// Map subscription plans to DTO
			let plans = subscriptionPlans.map((plan) => ({
				...plan,
				maxWorkspaces: isUnlimited(plan.maxWorkspaces),
				maxVideoCount: isUnlimited(plan.maxVideoCount),
				maxMembers: isUnlimited(plan.maxMembers),
				maxRecordingDuration: isUnlimited(plan.maxRecordingDuration),
			}));

			let activeSubscription = null;
			let subscriptionData = null;

			activeSubscription = await this.userSubscriptionRepository.getActivePlan(
				dto.userId
			);
			if (activeSubscription) {
				subscriptionData =
					await this.userSubscriptionRepository.findSubscription(dto.userId);
			}
			if (activeSubscription) {
				plans = plans.map((plan) => ({
					...plan,
					active: plan.id === activeSubscription.planId,
					subscriptionData: subscriptionData ? subscriptionData : null,
				}));
			}

			const response: GetUserPlansWithSubscriptionResponseDTO = {
				plans,
				activeSubscription,
			};

			return {
				success: true,
				data: response,
			};
		} catch (err: any) {
			logger.error("Error fetching subscription plans:", err);
			return {
				success: false,
				data: { error: err.message },
			};
		}
	}
}
