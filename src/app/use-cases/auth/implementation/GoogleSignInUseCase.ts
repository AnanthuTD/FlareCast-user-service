import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { IGenerateRefreshTokenProvider } from "@/app/providers/IGenerateRefreshToken";
import { IGenerateAccessTokenProvider } from "@/app/providers/IGenerateAccessToken";
import { ResponseDTO } from "@/domain/dtos/Response";
import { GoogleSignInDTO } from "@/domain/dtos/authenticate/GoogleSignInDTO";
import { GoogleSignInResponseDTO } from "@/domain/dtos/authenticate/GoogleSignInResponseDTO";
import { GoogleSignInErrorType } from "@/domain/enums/Authenticate/GoogleSignInErrorType";
import { IGoogleSignInUseCase } from "../IGoogleSignInUseCase";
import { logger } from "@/infra/logger";
import axios from "axios";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { IEventService } from "@/app/services/IEventService";

@injectable()
export class GoogleSignInUseCase implements IGoogleSignInUseCase {
	constructor(
		@inject(TOKENS.UserRepository)
		private readonly usersRepository: IUsersRepository,
		@inject(TOKENS.GenerateRefreshTokenProvider)
		private readonly refreshTokenGenerator: IGenerateRefreshTokenProvider,
		@inject(TOKENS.GenerateAccessTokenProvider)
		private readonly accessTokenGenerator: IGenerateAccessTokenProvider,
		@inject(TOKENS.EventService)
		private readonly eventService: IEventService,
		@inject(TOKENS.UserSubscriptionRepository)
		private readonly userSubscriptionRepository: IUserSubscriptionRepository
	) {}

	async execute(dto: GoogleSignInDTO): Promise<ResponseDTO> {
		try {
			if (!dto.code || !dto.code.access_token) {
				logger.error("Failed to exchange authorization code for access token");
				return {
					success: false,
					data: { error: GoogleSignInErrorType.InvalidAuthorizationCode },
				};
			}

			// Fetch user information using the access token
			const userInfoResponse = await axios.get(
				"https://www.googleapis.com/oauth2/v1/userinfo",
				{
					headers: {
						Authorization: `Bearer ${dto.code.access_token}`,
						Accept: "application/json",
					},
				}
			);

			const payload = userInfoResponse.data;
			if (!payload || !payload.email) {
				logger.error("Failed to fetch user information from Google");
				return {
					success: false,
					data: { error: GoogleSignInErrorType.FailedToFetchAdminInfo },
				};
			}

			// Check if the user exists, create if not
			let user = await this.usersRepository.findByEmail(payload.email);
			if (!user || !user.id) {
				user = await this.usersRepository.create({
					email: payload.email,
					firstName: payload.given_name || "Google",
					lastName: payload.family_name || "User",
					image: payload.picture,
					isVerified: true,
				});

				const activePlan = await this.userSubscriptionRepository.getActivePlan(
					user.id!
				);

				// Publish user verified event
				await this.eventService.publishUserVerifiedEvent({
					userId: user.id!,
					firstName: user.firstName,
					lastName: user.lastName ?? "",
					email: user.email.address,
					image: user.image ?? "",
					plan: activePlan,
				});
			}

			// Check if the user is banned
			if (user.isBanned) {
				logger.info("User is banned:", user.id);
				return {
					success: false,
					data: { error: GoogleSignInErrorType.UserBanned },
				};
			}

			const userPayload = {
				id: user.id!,
				role: "user",
			};

			// Generate access token
			const accessToken = await this.accessTokenGenerator.generateToken(
				userPayload
			);

			// Generate refresh token
			const refreshToken = await this.refreshTokenGenerator.generateToken(
				userPayload
			);

			// Prepare the user response
			const userResponse: GoogleSignInResponseDTO = {
				message: "Successfully authenticated",
				user: {
					id: user.id!,
					email: user.email.address,
					firstName: user.firstName,
					lastName: user.lastName,
					image: user.image,
				},
				accessToken,
				refreshToken,
			};

			return {
				success: true,
				data: userResponse,
			};
		} catch (err: any) {
			if (axios.isAxiosError(err))
				console.error(JSON.stringify(err.response?.data, null, 2));
			logger.error("Error during Google sign-in:", err);
			return {
				success: false,
				data: { error: err.message },
			};
		}
	}
}
