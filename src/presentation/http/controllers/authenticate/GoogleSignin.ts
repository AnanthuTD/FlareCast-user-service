import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { Service,  Inject } from "typedi";
import axios from "axios";
import { IGenerateRefreshTokenProvider } from "@/app/providers/IGenerateRefreshToken";
import { IGenerateAccessTokenProvider } from "@/app/providers/IGenerateAccessToken";
import { EventService } from "@/app/services/EventService";
import { TOKENS } from "@/app/tokens";
import env from "@/infra/env";

/**
 * Controller for handling Google sign-in requests.
 */
@Service()export class GoogleSignInController implements IController {

	constructor(
		@Inject(TOKENS.UserRepository)
		private readonly usersRepository: IUsersRepository,
		@Inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@Inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess,
		@Inject(TOKENS.GenerateRefreshTokenProvider) private readonly refreshTokenGenerator: IGenerateRefreshTokenProvider,
		@Inject(TOKENS.GenerateAccessTokenProvider) private readonly accessTokenGenerator: IGenerateAccessTokenProvider,
		@Inject(TOKENS.EventService) private readonly eventService: EventService
	) {
	}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		if (!httpRequest.body || !httpRequest.body.code) {
			error = this.httpErrors.error_400();
			return new HttpResponse(error.statusCode, {
				message: "Authorization code is required",
			});
		}

		const code = httpRequest.body.code as string;

		try {
			// Exchange the authorization code for an access token
			const tokenResponse = await axios.post(
				"https://oauth2.googleapis.com/token",
				{
					code,
					client_id: env.GOOGLE_CLIENT_ID,
					grant_type: "authorization_code",
				}
			);

			const { access_token } = tokenResponse.data;
			if (!access_token) {
				logger.error("Failed to exchange authorization code for access token");
				error = this.httpErrors.error_400();
				return new HttpResponse(error.statusCode, {
					message: "Failed to authenticate with Google",
				});
			}

			// Fetch user information using the access token
			const userInfoResponse = await axios.get(
				"https://www.googleapis.com/oauth2/v1/userinfo",
				{
					headers: {
						Authorization: `Bearer ${access_token}`,
						Accept: "application/json",
					},
				}
			);

			const payload = userInfoResponse.data;
			if (!payload || !payload.email) {
				logger.error("Failed to fetch user information from Google");
				error = this.httpErrors.error_400();
				return new HttpResponse(error.statusCode, {
					message: "Failed to fetch user information from Google",
				});
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

				// Publish user verified event
				await this.eventService.publishUserVerifiedEvent({
					userId: user.id,
					firstName: user.firstName,
					lastName: user.lastName ?? "",
					email: user.email.address,
					image: user.image ?? "",
				});
			}

			if (user.isBanned) {
				logger.info("User is banned");
				error = this.httpErrors.error_403();
				return new HttpResponse(error.statusCode, {
					message: "Forbidden: User is banned",
				});
			}

			// Generate access token
			const accessToken = this.accessTokenGenerator.generateToken({
				id: user.id,
			})

			// Generate refresh token
			const refreshToken = this.refreshTokenGenerator.generateToken({
				id: user.id,
			})

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
					message: "Successfully authenticated",
					user: userResponse,
					accessToken,
					refreshToken,
				},
			};

			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.error("Error during Google sign-in:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
