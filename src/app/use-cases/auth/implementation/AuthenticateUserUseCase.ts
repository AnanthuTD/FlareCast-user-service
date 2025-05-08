import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { ITokenManagerProvider } from "@/app/providers/ITokenManager";
import { ResponseDTO } from "@/domain/dtos/Response";
import { AuthenticateUserDTO } from "@/domain/dtos/authenticate/AuthenticateUserDTO";
import { AuthenticateUserErrorType } from "@/domain/enums/Authenticate/AuthenticateUser/ErrorType";
import { logger } from "@/infra/logger";

@injectable()
export class AuthenticateUserUseCase {
	constructor(
		@inject(TOKENS.UserRepository)
		private readonly usersRepository: IUsersRepository,
		@inject(TOKENS.TokenManagerProvider)
		private readonly tokenManager: ITokenManagerProvider
	) {}

	async execute(dto: AuthenticateUserDTO): Promise<ResponseDTO> {
		try {
			// Step 1: Validate the token's authenticity
			const isValidToken = this.tokenManager.validateAccessToken(
				dto.accessToken
			);
			if (!isValidToken) {
				logger.warn("Invalid access token:", dto.accessToken);
				return {
					success: false,
					data: { error: AuthenticateUserErrorType.InvalidToken },
				};
			}

			// Step 2: Check if the token has expired
			const expiresAt = this.tokenManager.getExpiresAt(dto.accessToken);
			const isTokenExpired = this.tokenManager.validateTokenAge(expiresAt);
			if (isTokenExpired) {
				logger.warn("Expired access token:", dto.accessToken);
				return {
					success: false,
					data: { error: AuthenticateUserErrorType.InvalidToken },
				};
			}

			// Step 3: Extract the payload
			const payload = this.tokenManager.getPayload(dto.accessToken);
			if (!payload.id) {
				logger.warn("Token payload does not contain user ID:", payload);
				return {
					success: false,
					data: { error: AuthenticateUserErrorType.InvalidToken },
				};
			}

			logger.info("JWT Payload:", payload);

			// Step 4: Fetch the user from the repository
			const user = await this.usersRepository.findById(payload.id);
			if (!user) {
				logger.warn("User not found for ID:", payload.id);
				return {
					success: false,
					data: { error: AuthenticateUserErrorType.UserNotFound },
				};
			}

			// Step 5: Check if the user is banned
			if (user.isBanned) {
				logger.warn("User is banned:", user.id);
				return {
					success: false,
					data: { error: AuthenticateUserErrorType.UserBanned },
				};
			}

			// Step 6: Prepare the user response
			const userResponse = {
				id: user.id!,
				email: user.email.address,
				firstName: user.firstName,
				lastName: user.lastName,
				image: user.image,
			};

			return {
				success: true,
				data: { user: userResponse },
			};
		} catch (err: any) {
			logger.error("Authentication failed:", err);
			return {
				success: false,
				data: { error: AuthenticateUserErrorType.InvalidToken },
			};
		}
	}
}
