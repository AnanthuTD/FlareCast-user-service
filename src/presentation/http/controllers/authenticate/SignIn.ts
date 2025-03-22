import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import {  Inject } from "typedi";
import env from "@/infra/env";
import axios from "axios";
import { EventService } from "@/app/services/EventService";
import { IGenerateRefreshTokenProvider } from "@/app/providers/IGenerateRefreshToken";
import { User } from "@/domain/entities/User";
import { IGenerateAccessTokenProvider } from "@/app/providers/IGenerateAccessToken";
import { TOKENS } from "@/app/tokens";
import { ITokenManagerProvider } from "@/app/providers/ITokenManager";
import { IRefreshTokenRepository } from "@/app/repositories/IRefreshTokenRepository";

/**
 * Controller for handling user login requests.
 */
export class UserLoginController implements IController {
	constructor(
		@Inject(TOKENS.EventService) private readonly eventService: EventService,
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

		const user = httpRequest.user;
		if (!user || !user.id) {
			error = this.httpErrors.error_400();
			return new HttpResponse(error.statusCode, {
				message: "Invalid credentials",
			});
		}

		try {
			const foundUser = await this.usersRepository.findById(user.id);
			if (!foundUser || !foundUser.id) {
				error = this.httpErrors.error_404();
				return new HttpResponse(error.statusCode, {
					message: "User not found",
				});
			}

			if (foundUser.isBanned) {
				error = this.httpErrors.error_403();
				return new HttpResponse(error.statusCode, {
					message: "User is banned",
				});
			}

			// Check if the user needs to be verified
			if (!foundUser.isVerified) {
				const verificationResponse = await this.checkIfVerified(foundUser);
				if (verificationResponse.statusCode !== 200) {
					return verificationResponse;
				}
			}

			// Generate access token
			const accessToken = this.accessTokenGenerator.generateToken({
				id: foundUser.id,
			});

			// Generate refresh token
			const refreshToken = this.refreshTokenGenerator.generateToken({
				id: foundUser.id,
			});

			// Prepare the user response object
			const userResponse = {
				id: foundUser.id,
				email: foundUser.email.address,
				firstName: foundUser.firstName,
				lastName: foundUser.lastName,
				image: foundUser.image,
			};

			response = {
				success: true,
				data: {
					accessToken,
					refreshToken,
					user: userResponse,
				},
			};
			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.error("Error during user login:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}

	private async checkIfVerified(user: User): Promise<IHttpResponse> {
		logger.debug("Checking if user is verified: ", user);

		try {
			const { data } = await axios.get(
				`${env.EMAIL_SERVICE_URL}/api/isVerified/${user.id}`
			);
			if (!data.verified) {
				const error = this.httpErrors.error_401();
				return new HttpResponse(error.statusCode, {
					message: "User not verified",
				});
			}

			// Publish user verified event
			await this.eventService.publishUserVerifiedEvent({
				userId: user.id!,
				email: user.email.address,
				firstName: user.firstName,
				lastName: user.lastName ?? "",
				image: user.image ?? "",
			});

			const success = this.httpSuccess.success_200({
				message: "User is verified",
			});
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.debug("Failed to check if user is verified:", err.message);
			const error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Failed to verify user status",
			});
		}
	}
}
