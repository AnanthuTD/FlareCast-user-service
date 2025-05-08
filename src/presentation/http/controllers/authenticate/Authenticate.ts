// backend/src/presentation/http/controllers/authenticate/Authenticate.ts
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { logger } from "@/infra/logger";
import { TOKENS } from "@/app/tokens";
import { inject, injectable } from "inversify";
import { AuthenticateUserDTO } from "@/domain/dtos/authenticate/AuthenticateUserDTO";
import { AuthenticateUserErrorType } from "@/domain/enums/Authenticate/AuthenticateUser/ErrorType";
import { AuthenticateUserUseCase } from "@/app/use-cases/auth/implementation/AuthenticateUserUseCase";

/**
 * Controller for authenticating a user based on an access token.
 */
@injectable()
export class AuthenticateUserController implements IController {
	constructor(
		@inject(TOKENS.AuthenticateUserUseCase)
		private readonly authenticateUserUseCase: AuthenticateUserUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;

		try {
			// Extract the access token from the cookies
			const accessToken = httpRequest.cookies?.accessToken;

			if (!accessToken) {
				error = this.httpErrors.unauthorized();
				return new HttpResponse(error.statusCode, {
					message: "Access token not found in cookies",
				});
			}

			// Create DTO and call the use case
			const dto: AuthenticateUserDTO = { accessToken };
			const response = await this.authenticateUserUseCase.execute(dto);

			if (!response.success) {
				const errorType = response.data.error as AuthenticateUserErrorType;
				switch (errorType) {
					case AuthenticateUserErrorType.UserNotFound:
						error = this.httpErrors.unauthorized();
						return new HttpResponse(error.statusCode, {
							message: "User not found",
						});
					case AuthenticateUserErrorType.UserBanned:
						error = this.httpErrors.forbidden();
						return new HttpResponse(error.statusCode, {
							message: "User is banned",
						});
					case AuthenticateUserErrorType.InvalidToken:
						error = this.httpErrors.unauthorized();
						return new HttpResponse(error.statusCode, {
							message: "Invalid or expired token",
						});
					default:
						error = this.httpErrors.internalServerError();
						return new HttpResponse(error.statusCode, {
							message: "Internal server error",
						});
				}
			}

			// Return the authenticated user data
			const success = this.httpSuccess.ok(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err: any) {
			logger.error("Authentication failed:", err);
			error = this.httpErrors.internalServerError();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
