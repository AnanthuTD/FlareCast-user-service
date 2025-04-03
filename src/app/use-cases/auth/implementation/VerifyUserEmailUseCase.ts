import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IEmailService } from "@/app/services/IEmailService";
import { ResponseDTO } from "@/domain/dtos/Response";
import { UserLoginErrorType } from "@/domain/enums/Authenticate/UserLoginErrorType";
import { IVerifyUserEmailUseCase } from "../IVerifyUserEmailUseCase";
import { logger } from "@/infra/logger";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";

@injectable()
export class VerifyUserEmailUseCase implements IVerifyUserEmailUseCase {
	constructor(
		@inject(TOKENS.EmailService)
		private readonly emailService: IEmailService,
		@inject(TOKENS.UserRepository)
		private readonly usersRepository: IUsersRepository
	) {}

	async execute(userId: string): Promise<ResponseDTO> {
		try {
			const response = await this.emailService.isUserVerified(userId);
			console.log("verification email usecase response: ", response);

			if (!response.verified) {
				logger.debug("User is not verified:", userId);
				return {
					success: false,
					data: { error: UserLoginErrorType.UserNotVerified },
				};
			}

			await this.usersRepository.markAsVerified(
				response.userId,
				response.email
			);

			return {
				success: true,
				data: { message: "User is verified" },
			};
		} catch (err: any) {
			logger.debug("Failed to check if user is verified:", err.message);
			return {
				success: false,
				data: { error: UserLoginErrorType.EmailServiceUnavailable },
			};
		}
	}
}
