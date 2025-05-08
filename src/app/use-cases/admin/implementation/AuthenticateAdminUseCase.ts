import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { ITokenManagerProvider } from "@/app/providers/ITokenManager";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { AuthenticateAdminErrorType } from "@/domain/enums/Admin/Authentication/AdminAuthenticateErrorTypes";
import { AuthenticateAdminDTO } from "@/domain/dtos/admin/authentication/AuthenticateAdminDTO";
import { IAdminRepository } from "@/app/repositories/IAdminRepository";

@injectable()
export class AuthenticateAdminUseCase {
	constructor(
		@inject(TOKENS.AdminRepository)
		private readonly adminRepository: IAdminRepository,
		@inject(TOKENS.TokenManagerProvider)
		private readonly tokenManager: ITokenManagerProvider
	) {}

	async execute(dto: AuthenticateAdminDTO): Promise<ResponseDTO> {
		try {
			// console.log("DTO: ", dto)
			// Step 1: Validate the token's authenticity
			const isValidToken = this.tokenManager.validateAdminAccessToken(
				dto.accessToken
			);
			if (!isValidToken) {
				logger.warn("Invalid access token:", dto.accessToken);
				return {
					success: false,
					data: { error: AuthenticateAdminErrorType.InvalidToken },
				};
			}

			// Step 2: Check if the token has expired
			const expiresAt = this.tokenManager.getExpiresAt(dto.accessToken);
			const isTokenExpired = this.tokenManager.validateTokenAge(expiresAt);
			if (isTokenExpired) {
				logger.warn("Expired access token:", dto.accessToken);
				return {
					success: false,
					data: { error: AuthenticateAdminErrorType.InvalidToken },
				};
			}

			// Step 3: Extract the payload
			const payload = this.tokenManager.getPayload(dto.accessToken);
			if (!payload.id) {
				logger.warn("Token payload does not contain admin ID:", payload);
				return {
					success: false,
					data: { error: AuthenticateAdminErrorType.InvalidToken },
				};
			}

			logger.info("JWT Payload:", payload);

			// Step 4: Fetch the user from the repository
			const admin = await this.adminRepository.findById(payload.id);
			if (!admin) {
				logger.warn("User not found for ID:", payload.id);
				return {
					success: false,
					data: { error: AuthenticateAdminErrorType.AdminNotFound },
				};
			}

			// Step 6: Prepare the user response
			const adminResponse = {
				id: admin.id!,
				email: admin.email,
				firstName: admin.firstName,
				lastName: admin.lastName,
				// image: admin.image,
			};

			logger.debug("admin is authenticated")

			return {
				success: true,
				data: { admin: adminResponse },
			};
		} catch (err: any) {
			logger.error("Authentication failed:", err);
			return {
				success: false,
				data: { error: AuthenticateAdminErrorType.InvalidToken },
			};
		}
	}
}
