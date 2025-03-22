import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { logger } from "@/infra/logger";
import { Inject } from "typedi";
import env from "@/infra/env";
import jwt from "jsonwebtoken";
import { TOKENS } from "@/app/tokens";

/**
 * Controller for authenticating a user based on an access token.
 */
export class AuthenticateUserController implements IController {
	constructor(
		@Inject(TOKENS.UserRepository)
		private readonly usersRepository: IUsersRepository,
		@Inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@Inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;

		try {
			// Extract the access token from the cookies
			const accessToken = httpRequest.cookies?.accessToken;

			if (!accessToken) {
				error = this.httpErrors.error_401();
				return new HttpResponse(error.statusCode, {
					message: "Access token not found in cookies",
				});
			}

			// Verify the token
			const payload = jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET) as {
				id: string;
				type?: string;
			};

			logger.info("JWT Payload:", payload);

			// Fetch the user from the repository
			const user = await this.usersRepository.findById(payload.id);

			if (!user) {
				error = this.httpErrors.error_401();
				return new HttpResponse(error.statusCode, {
					message: "User not found",
				});
			}

			if (user.isBanned) {
				error = this.httpErrors.error_403();
				return new HttpResponse(error.statusCode, {
					message: "User is banned",
				});
			}

			// Return the authenticated user data
			const userResponse = {
				id: user.id,
				email: user.email.address,
				firstName: user.firstName,
				lastName: user.lastName,
				image: user.image,
			};

			const success = this.httpSuccess.success_200({
				user: userResponse,
			});
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.error("Authentication failed:", err);
			error = this.httpErrors.error_401();
			return new HttpResponse(error.statusCode, {
				message: "Invalid or expired token",
			});
		}
	}
}
