import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IGenerateRefreshTokenProvider } from "@/app/providers/IGenerateRefreshToken";
import { IGenerateAccessTokenProvider } from "@/app/providers/IGenerateAccessToken";
import { ResponseDTO } from "@/domain/dtos/Response";
import { GoogleSignInDTO } from "@/domain/dtos/authenticate/GoogleSignInDTO";
import { GoogleSignInResponseDTO } from "@/domain/dtos/authenticate/GoogleSignInResponseDTO";
import { IGoogleSignInUseCase } from "../IGoogleSignInUseCase";
import { logger } from "@/infra/logger";
import axios from "axios";
import { IAdminRepository } from "@/app/repositories/IAdminRepository";
import { GoogleSignInErrorType } from "@/domain/enums/Admin/Authentication/GoogleSignInErrorType";

@injectable()
export class AdminGoogleSigninUseCase implements IGoogleSignInUseCase {
	constructor(
		@inject(TOKENS.AdminRepository)
		private readonly adminRepository: IAdminRepository,
		@inject(TOKENS.GenerateRefreshTokenProvider)
		private readonly refreshTokenGenerator: IGenerateRefreshTokenProvider,
		@inject(TOKENS.GenerateAccessTokenProvider)
		private readonly accessTokenGenerator: IGenerateAccessTokenProvider
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
			let admin = await this.adminRepository.findByEmail(payload.email);
			if (!admin || !admin.id) {
				return {
					success: false,
					data: { error: GoogleSignInErrorType.ADMIN_NOT_FOUND },
				};
			}

			// Generate access token
			const accessToken = await this.accessTokenGenerator.generateAdminToken({
				id: admin.id!,
			});

			// Generate refresh token
			const refreshToken = await this.refreshTokenGenerator.generateAdminToken({
				id: admin.id!,
			});

			// Prepare the user response
			const adminResponse: GoogleSignInResponseDTO = {
				message: "Successfully authenticated",
				user: {
					id: admin.id!,
					email: admin.email,
					firstName: admin.firstName,
					lastName: admin.lastName,
					// image: admin.image,
				},
				accessToken,
				refreshToken,
			};

			return {
				success: true,
				data: adminResponse,
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
