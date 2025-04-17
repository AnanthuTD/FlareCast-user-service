import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { ISubscriptionRepository } from "@/app/repositories/ISubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { GetPlansResponseDTO } from "@/domain/dtos/subscription/GetPlansResponseDTO";
import { GetPlansErrorType } from "@/domain/enums/Subscription/GetPlansErrorType";
import { IGetPlansUseCase } from "../IGetPlansUseCase";
import { logger } from "@/infra/logger";

@injectable()
export class GetPlansUseCase implements IGetPlansUseCase {
	constructor(
		@inject(TOKENS.SubscriptionRepository)
		private readonly subscriptionRepository: ISubscriptionRepository,
	) {}

	async execute(): Promise<ResponseDTO> {
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

			const response: GetPlansResponseDTO = {
				plans,
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
