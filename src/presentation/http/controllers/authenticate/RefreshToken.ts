import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { Service, Inject } from "typedi";
import { IGenerateRefreshTokenProvider } from "@/app/providers/IGenerateRefreshToken";
import { IGenerateAccessTokenProvider } from "@/app/providers/IGenerateAccessToken";
import { ITokenManagerProvider } from "@/app/providers/ITokenManager";
import { IRefreshTokenRepository } from "@/app/repositories/IRefreshTokenRepository";
import { TOKENS } from "@/app/tokens";

/**
 * Controller for handling refresh token requests.
 */
export class RefreshTokenController implements IController {
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

		const accessToken = httpRequest.cookies?.accessToken;
		const refreshToken = httpRequest.cookies?.refreshToken;

		// Check if refreshToken exists
		if (!refreshToken) {
			logger.debug("No refresh token found in cookies");
			error = this.httpErrors.error_401();
			return new HttpResponse(error.statusCode, {
				message: "Unauthorized: No refresh token",
			});
		}

		try {
			// Check if accessToken exists and is still valid
			if (accessToken) {
				const accessTokenPayload = this.tokenManager.getExpiresAt(accessToken);
				const currentTime = Math.floor(Date.now() / 1000);
				const isAccessTokenExpired = currentTime > accessTokenPayload.exp;
				if (!isAccessTokenExpired) {
					logger.debug("Access token is still valid");
					response = {
						success: true,
						data: {
							accessToken,
							message: "Access token is still valid",
						},
					};
					const success = this.httpSuccess.success_200(response.data);
					return new HttpResponse(success.statusCode, success.body);
				}
			}

			// Verify the refresh token
			const isRefreshTokenValid = this.tokenManager.validateToken(refreshToken);
			if (!isRefreshTokenValid) {
				logger.debug("Invalid refresh token payload");
				error = this.httpErrors.error_401();
				return new HttpResponse(error.statusCode, {
					message: "Unauthorized: Invalid refresh token",
				});
			}

			// Check if the refresh token exists in the database and is not expired
			const isBlacklisted =
				await this.refreshTokenRepository.isTokenBlacklisted(refreshToken);

			if (isBlacklisted) {
				logger.debug("Refresh token is blacklisted");
				error = this.httpErrors.error_401();
				return new HttpResponse(error.statusCode, {
					message: "Unauthorized: Refresh token is blacklisted",
				});
			}

			const payload = this.tokenManager.getPayload(refreshToken);

			// Fetch the user
			const user = await this.usersRepository.findById(payload.id);
			if (!user || !user.id) {
				logger.debug(`User with ID ${payload.id} not found`);
				error = this.httpErrors.error_401();
				return new HttpResponse(error.statusCode, {
					message: "Unauthorized: User not found",
				});
			}

			if (user.isBanned) {
				logger.debug("User is banned");
				error = this.httpErrors.error_403();
				return new HttpResponse(error.statusCode, {
					message: "Forbidden: User is banned",
				});
			}

			// Generate access token
			const newAccessToken = this.accessTokenGenerator.generateToken({
				id: user.id,
			});

			// Generate refresh token
			const newRefreshToken = this.refreshTokenGenerator.generateToken({
				id: user.id,
			});

			// Respond with new access token
			response = {
				success: true,
				data: {
					accessToken: newAccessToken,
					refreshToken: newRefreshToken,
					message: "Refresh token has been updated",
				},
			};
			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.error("Error during refresh token handling:", err);
			error = this.httpErrors.error_401();
			return new HttpResponse(error.statusCode, {
				message: "Unauthorized: Invalid refresh token",
			});
		}
	}
}
