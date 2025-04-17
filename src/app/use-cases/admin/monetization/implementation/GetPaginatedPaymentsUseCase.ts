import { inject, injectable } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { IGetPaginatedPaymentsUseCase } from "../IGetPaginatedPaymentsUseCase";
import { logger } from "@/infra/logger";
import { GetPaginatedPaymentsDTO } from "@/domain/dtos/admin/monetization/GetPaginatedPaymentsDTO";
import { GetPaginatedPaymentsResponseDTO } from "../../../../../domain/dtos/admin/monetization/GetPaginatedPaymentsResponseDTO";

@injectable()
export class GetPaginatedPaymentsUseCase
	implements IGetPaginatedPaymentsUseCase
{
	constructor(
		@inject(TOKENS.UserSubscriptionRepository)
		private readonly userSubscriptionRepository: IUserSubscriptionRepository
	) {}

	async execute(
		dto: GetPaginatedPaymentsDTO
	): Promise<
		ResponseDTO & { data: GetPaginatedPaymentsResponseDTO | { error: string } }
	> {
		try {
			const { subscriptions, total } =
				await this.userSubscriptionRepository.getPaginatedPayments({
					take: dto.limit,
					skip: dto.skip,
					status: dto.status,
				});
			return {
				success: true,
				data: { data: subscriptions, total, limit: dto.limit, page: dto.skip / dto.limit },
			};
		} catch (err: any) {
			logger.error("Failed to get paginated payments", err);
			return {
				success: false,
				data: { error: "Failed to get paginated payments" },
			};
		}
	}
}
