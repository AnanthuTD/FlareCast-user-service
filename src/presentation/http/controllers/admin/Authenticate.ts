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
import { AuthenticateAdminUseCase } from "@/app/use-cases/admin/implementation/AuthenticateAdminUseCase";
import { AuthenticateAdminErrorType } from "@/domain/enums/Admin/Authentication/AdminAuthenticateErrorTypes";

/**
 * Controller for authenticating a user based on an access token.
 */
@injectable()
export class AuthenticateAdminController implements IController {
	constructor(
		@inject(TOKENS.AuthenticateAdminCase)
		private readonly authenticateAdminUseCase: AuthenticateAdminUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
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

			// Create DTO and call the use case
			const dto: AuthenticateUserDTO = { accessToken };
			const response = await this.authenticateAdminUseCase.execute(dto);

			if (!response.success) {
				const errorType = response.data.error as AuthenticateAdminErrorType;
				switch (errorType) {
					case AuthenticateAdminErrorType.AdminNotFound:
						error = this.httpErrors.error_401();
						return new HttpResponse(error.statusCode, {
							message: "Admin not found",
						});
					case AuthenticateAdminErrorType.InvalidToken:
						error = this.httpErrors.error_401();
						return new HttpResponse(error.statusCode, {
							message: "Invalid or expired token",
						});
					default:
						error = this.httpErrors.error_500();
						return new HttpResponse(error.statusCode, {
							message: "Internal server error",
						});
				}
			}

			logger.debug("In auth controller");

			// Return the authenticated user data
			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err: any) {
			logger.error("Authentication failed:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
