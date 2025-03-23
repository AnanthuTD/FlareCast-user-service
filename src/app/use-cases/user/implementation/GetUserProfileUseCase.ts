import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { GetUserProfileDTO } from "@/domain/dtos/user/GetUserProfileDTO";
import {
	GetUserProfileResponseDTO,
	UserProfileDTO,
} from "@/domain/dtos/user/GetUserProfileResponseDTO";
import { GetUserProfileErrorType } from "@/domain/enums/User/GetUserProfileErrorType";
import { IGetUserProfileUseCase } from "../IGetUserProfileUseCase";
import { logger } from "@/infra/logger";

@injectable()
export class GetUserProfileUseCase implements IGetUserProfileUseCase {
	constructor(
		@inject(TOKENS.UserRepository)
		private readonly usersRepository: IUsersRepository,
		@inject(TOKENS.UserSubscriptionRepository)
		private readonly userSubscriptionRepository: IUserSubscriptionRepository
	) {}

	async execute(dto: GetUserProfileDTO): Promise<ResponseDTO> {
		try {
			// Validate user ID
			if (!dto.userId) {
				logger.debug("User ID is required");
				return {
					success: false,
					data: { error: GetUserProfileErrorType.MissingUserId },
				};
			}

			// Fetch user data
			const user = await this.usersRepository.findById(dto.userId);
			if (!user) {
				logger.debug(`User ${dto.userId} not found`);
				return {
					success: false,
					data: { error: GetUserProfileErrorType.UserNotFound },
				};
			}

			// Fetch active subscription
			const activeSubscription =
				await this.userSubscriptionRepository.getActiveSubscription(dto.userId);

			// Prepare the response
			const userProfile: UserProfileDTO = {
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				image: user.image,
				plan: activeSubscription ? { planId: activeSubscription.planId } : null,
			};

			const response: GetUserProfileResponseDTO = {
				user: userProfile,
			};

			return {
				success: true,
				data: response,
			};
		} catch (err: any) {
			logger.error("Failed to fetch user profile:", err);
			return {
				success: false,
				data: { error: err.message },
			};
		}
	}
}
