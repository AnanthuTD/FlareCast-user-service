import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { logger } from "@/infra/logger";
import { IGetPlansUseCase } from "../IGetPlansUseCase";
import { ISubscriptionRepository } from "@/app/repositories/ISubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { GetPlansErrorType } from "@/domain/enums/Admin/SubscriptionPlan/GetPlansErrorType";
import { GetPlansAdminDto } from "@/domain/dtos/admin/subscriptionPlan/GetPlansAdminDto";
import { GetPlansResponseDTO } from "@/domain/dtos/admin/subscriptionPlan/GetPlansResponseDTO";

@injectable()
export class GetPlansUseCase implements IGetPlansUseCase {
	constructor(
		@inject(TOKENS.SubscriptionRepository)
		private readonly subscriptionPlanRepository: ISubscriptionRepository
	) {}

	async execute(
		dto: GetPlansAdminDto
	): Promise<ResponseDTO & { data: GetPlansResponseDTO | { error: string } }> {
		try {
			const isActive = dto.status === "all" ? null : dto.status === "active";

			logger.debug(isActive + " " + dto.status);

			const plans = await this.subscriptionPlanRepository.findAll({
				isActive,
				limit: dto.limit,
				skip: dto.skip,
			});

			const totalPlans = await this.subscriptionPlanRepository.count({
				isActive,
			});

			const response: GetPlansResponseDTO = {
				plans,
				total: totalPlans,
			};

			logger.info(`Fetched ${plans.length} subscription plans`);
			return {
				success: true,
				data: response,
			};
		} catch (err: any) {
			logger.error("Error fetching subscription plans:", {
				message: err.message,
				stack: err.stack,
			});
			return {
				success: false,
				data: { error: GetPlansErrorType.InternalError },
			};
		}
	}
}
