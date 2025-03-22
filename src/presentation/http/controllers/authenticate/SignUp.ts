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
import { IGenerateAccessTokenProvider } from "@/app/providers/IGenerateAccessToken";
import { IGenerateRefreshTokenProvider } from "@/app/providers/IGenerateRefreshToken";
import { EventService } from "@/app/services/EventService";
import { TOKENS } from "@/app/tokens";
import { IPasswordHasher } from "@/app/providers/IPasswordHasher";

/**
 * Controller for handling user sign-up requests.
 */
export class SignUpController implements IController {
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
		@Inject(TOKENS.PasswordHasher)
		private readonly passwordHasher: IPasswordHasher
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		const { email, password, firstName, lastName, image } =
			httpRequest.body as {
				email: string;
				password: string;
				firstName: string;
				lastName: string;
				image?: string;
			};
		if (!email || !password || !firstName || !lastName) {
			error = this.httpErrors.error_400();
			return new HttpResponse(error.statusCode, {
				message: "Email, password, first name, and last name are required",
			});
		}

		try {
			const exists = await this.usersRepository.userExists(email);
			if (exists) {
				error = this.httpErrors.error_400();
				return new HttpResponse(error.statusCode, {
					message: "User already exists",
				});
			}

			const hashedPassword = await this.passwordHasher.hashPassword(password);
			const user = await this.usersRepository.create({
				email,
				hashedPassword,
				firstName,
				lastName,
				image,
				isVerified: false,
			});

			if (!user || !user.id) {
				error = this.httpErrors.error_500();
				return new HttpResponse(error.statusCode, {
					message: "Failed to create user",
				});
			}

			// Publish user creation event
			await this.eventService.publishUserCreatedEvent({
				userId: user.id,
				email: user.email.address,
			});

			// Generate access token
			const accessToken = this.accessTokenGenerator.generateToken(user);

			// Generate refresh token
			const refreshToken = this.refreshTokenGenerator.generateToken(user);

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
					accessToken,
					refreshToken,
					user: userResponse,
					message: "Verify the email to continue!",
				},
			};
			const success = this.httpSuccess.success_201(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.error("Error during user sign-up:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
