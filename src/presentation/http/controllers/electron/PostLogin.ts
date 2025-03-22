import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { Inject } from "typedi";
import { IGenerateRefreshTokenProvider } from "@/app/providers/IGenerateRefreshToken";
import { IGenerateAccessTokenProvider } from "@/app/providers/IGenerateAccessToken";
import { ITokenManagerProvider } from "@/app/providers/ITokenManager";
import { IRefreshTokenRepository } from "@/app/repositories/IRefreshTokenRepository";
import { TOKENS } from "@/app/tokens";

/**
 * Controller for handling Electron post-login requests.
 */
export class ElectronPostLoginController implements IController {
	constructor(
		@Inject(TOKENS.UserRepository)
		private readonly usersRepository: IUsersRepository,
		@Inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@Inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess,
		@Inject(TOKENS.GenerateRefreshTokenProvider)
		private readonly refreshTokenGenerator: IGenerateRefreshTokenProvider,
		@Inject(TOKENS.GenerateAccessTokenProvider)
		private readonly accessTokenGenerator: IGenerateAccessTokenProvider,
		@Inject(TOKENS.TokenManagerProvider)
		private readonly tokenManager: ITokenManagerProvider,
		@Inject(TOKENS.RefreshTokenRepository)
		private readonly refreshTokenRepository: IRefreshTokenRepository
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		// logger.info("=================================Refreshing token by electron=================================");

		const refreshToken =
			httpRequest.cookies?.refreshToken || httpRequest.body.refreshToken;
		if (!refreshToken) {
			logger.info("No refresh token provided");
			error = this.httpErrors.error_401();
			return new HttpResponse(error.statusCode, {
				message: "Unauthorized: Refresh token not found",
			});
		}

		try {
			// Verify the refresh token
			const isValid = this.tokenManager.validateToken(refreshToken);
			if (!isValid) {
				logger.info("Invalid refresh token");
				error = this.httpErrors.error_401();
				return new HttpResponse(error.statusCode, {
					message: "Unauthorized: Invalid refresh token",
				});
			}

			const isTokenBlacklisted =
				await this.refreshTokenRepository.isTokenBlacklisted(refreshToken);

			if (isTokenBlacklisted) {
				logger.info("Refresh token is blacklisted");
				error = this.httpErrors.error_401();
				return new HttpResponse(error.statusCode, {
					message: "Unauthorized: Refresh token blacklisted",
				});
			}

			const payload = this.tokenManager.getPayload(refreshToken);

			// Fetch the user
			const user = await this.usersRepository.findById(payload.id);
			if (!user || !user.id) {
				logger.info("User not found for refresh token");
				error = this.httpErrors.error_401();
				return new HttpResponse(error.statusCode, {
					message: "Unauthorized: User not found",
				});
			}

			if (user.isBanned) {
				logger.info("User is banned");
				error = this.httpErrors.error_403();
				return new HttpResponse(error.statusCode, {
					message: "Forbidden: User is banned",
				});
			}

			// Generate new access token
			const accessToken = this.accessTokenGenerator.generateToken({
				id: user.id,
			});

			// Generate new refresh token (token rotation)
			const newRefreshToken = this.refreshTokenGenerator.generateToken({
				id: user.id,
			});

			// Prepare the user response object
			const userResponse = {
				id: user.id,
				email: user.email.address,
				firstName: user.firstName,
				lastName: user.lastName,
				image: user.image,
			};

			response = {
				success: true,
				data: {
					user: {
						accessToken,
						...userResponse,
					},
					accessToken,
					refreshToken: newRefreshToken,
				},
			};

			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.error("Error during Electron post-login token refresh:", err);
			error = this.httpErrors.error_401();
			return new HttpResponse(error.statusCode, {
				message: "Unauthorized: Invalid refresh token",
			});
		} finally {
			// logger.info("=================================End of Refreshing token=================================");
		}
	}
}
