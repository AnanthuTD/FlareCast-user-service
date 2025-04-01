import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { TOKENS } from "@/app/tokens";
import { inject, injectable } from "inversify";
import { IGoogleSignInUseCase } from "@/app/use-cases/admin/IGoogleSignInUseCase";
import { GoogleSignInDTO } from "@/domain/dtos/authenticate/GoogleSignInDTO";
import { GoogleSignInErrorType } from "@/domain/enums/Admin/Authentication/GoogleSignInErrorType";
import { IGenerateRefreshTokenProvider } from "@/app/providers/IGenerateRefreshToken";
import { ITokenManagerProvider } from "@/app/providers/ITokenManager";

/**
 * Controller for handling Google sign-in requests.
 */
@injectable()
export class AdminGoogleSignInController implements IController {
	constructor(
		@inject(TOKENS.AdminGoogleSignInUseCase)
		private readonly googleSignInUseCase: IGoogleSignInUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess,
		@inject(TOKENS.GenerateRefreshTokenProvider)
		private readonly tokenManager: ITokenManagerProvider
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		// Validate the request body
		if (!httpRequest.body || !httpRequest.body.code) {
			error = this.httpErrors.error_400();
			return new HttpResponse(error.statusCode, {
				message: "Authorization code is required",
			});
		}

		const code = httpRequest.body.code as string;

		try {
			// Create DTO and call the use case
			const dto: GoogleSignInDTO = { code };
			response = await this.googleSignInUseCase.execute(dto);

			if (!response.success) {
				const errorType = response.data.error as string;
				switch (errorType) {
					case GoogleSignInErrorType.InvalidAuthorizationCode:
						error = this.httpErrors.error_400();
						return new HttpResponse(error.statusCode, {
							message: "Failed to authenticate with Google",
						});
					case GoogleSignInErrorType.FailedToFetchAdminInfo:
						error = this.httpErrors.error_400();
						return new HttpResponse(error.statusCode, {
							message: "Failed to fetch admin information from Google",
						});
					case GoogleSignInErrorType.ADMIN_NOT_FOUND:
						error = this.httpErrors.error_401();
						return new HttpResponse(error.statusCode, {
							message: "Forbidden: Admin is banned",
						});
					default:
						error = this.httpErrors.error_500();
						return new HttpResponse(error.statusCode, {
							message: "Internal server error",
						});
				}
			}

			// Return the response
			const success = this.httpSuccess.success_200(response.data);

			return new HttpResponse(success.statusCode, success.body);
		} catch (err: any) {
			console.log(err)
			logger.error("Error during Google sign-in:");
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
