import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IAdminRepository } from "@/app/repositories/IAdminRepository";
import { IPasswordHasher } from "@/app/providers/IPasswordHasher";
import { ResponseDTO } from "@/domain/dtos/Response";
import { IAdminSignInUseCase } from "@/app/use-cases/admin/IAdminSignInUseCase";
import { logger } from "@/infra/logger";
import { ITokenManagerProvider } from "@/app/providers/ITokenManager";
import { AdminSignInDTO } from "@/domain/dtos/admin/authentication/AdminSignInDTO";
import { AdminSignInResponseDTO } from "@/domain/dtos/admin/authentication/AdminSignInResponseDTO";
import { AdminSignInErrorType } from "@/domain/enums/Admin/Authentication/AdminSignInErrorType";
import { IGenerateRefreshTokenProvider } from "@/app/providers/IGenerateRefreshToken";
import { IGenerateAccessTokenProvider } from "@/app/providers/IGenerateAccessToken";

@injectable()
export class AdminSignInUseCase implements IAdminSignInUseCase {
	constructor(
		@inject(TOKENS.AdminRepository)
		private readonly adminRepository: IAdminRepository,
		@inject(TOKENS.PasswordHasher)
		private readonly passwordHasher: IPasswordHasher,
		@inject(TOKENS.GenerateRefreshTokenProvider)
		private readonly refreshTokenGenerator: IGenerateRefreshTokenProvider,
		@inject(TOKENS.GenerateAccessTokenProvider)
		private readonly accessTokenGenerator: IGenerateAccessTokenProvider
	) {}

	async execute(
		dto: AdminSignInDTO
	): Promise<
		ResponseDTO & {
			data:
				| AdminSignInResponseDTO
				| {
						error: string;
						tokens?: { accessToken: string; refreshToken: string };
				  };
		}
	> {
		try {
			// Validate input
			if (!dto.email || !dto.password) {
				logger.debug("Email and password are required");
				return {
					success: false,
					data: { error: AdminSignInErrorType.MissingCredentials },
				};
			}

			// Find admin by email
			const admin = await this.adminRepository.findByEmail(dto.email);
			if (!admin || !admin.hashedPassword) {
				logger.debug(
					`Admin with email ${dto.email} not found or has no password`
				);
				return {
					success: false,
					data: { error: AdminSignInErrorType.InvalidCredentials },
				};
			}

			// Verify password
			const isPasswordValid = await this.passwordHasher.comparePasswords(
				dto.password,
				admin.hashedPassword
			);
			if (!isPasswordValid) {
				logger.debug(`Invalid password for admin ${dto.email}`);
				return {
					success: false,
					data: { error: AdminSignInErrorType.InvalidCredentials },
				};
			}

			// Generate tokens
			const userPayload = { id: admin.id, type: "admin" };
			const accessToken = this.accessTokenGenerator.generateToken(userPayload);
			const refreshToken = this.refreshTokenGenerator.generateToken(userPayload);

			// Prepare the response
			const response: AdminSignInResponseDTO = {
				admin: {
					id: admin.id,
					email: admin.email,
					firstName: admin.firstName,
					lastName: admin.lastName,
				},
			};

			logger.info(`Admin ${admin.id} signed in successfully`);
			return {
				success: true,
				data: {
					...response,
					tokens: { accessToken, refreshToken },
				},
			};
		} catch (err: any) {
			logger.error(`Error during admin sign-in for email ${dto.email}:`, {
				message: err.message,
				stack: err.stack,
			});
			return {
				success: false,
				data: { error: AdminSignInErrorType.InternalError },
			};
		}
	}
}
