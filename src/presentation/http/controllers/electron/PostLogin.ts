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
import { IElectronPostLoginUseCase } from "@/app/use-cases/auth/IElectronPostLoginUseCase";
import { ElectronPostLoginDTO } from "@/domain/dtos/authenticate/ElectronPostLoginDTO";
import { ElectronPostLoginErrorType } from "@/domain/enums/Authenticate/ElectronPostLoginErrorType";

/**
 * Controller for handling Electron post-login requests.
 */
@injectable()
export class ElectronPostLoginController implements IController {
	constructor(
		@inject(TOKENS.ElectronPostLoginUseCase)
		private readonly electronPostLoginUseCase: IElectronPostLoginUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		try {
			// Extract refresh token from cookies or body
			let refreshToken = httpRequest.cookies?.refreshToken;
			if (refreshToken === "undefined") {
				refreshToken = httpRequest.body.refreshToken;
			}

			// Create DTO and call the use case
			const dto: ElectronPostLoginDTO = { refreshToken };
			response = await this.electronPostLoginUseCase.execute(dto);

			if (!response.success) {
				const errorType = response.data.error as string;
				switch (errorType) {
					case ElectronPostLoginErrorType.MissingRefreshToken:
						error = this.httpErrors.error_401();
						return new HttpResponse(error.statusCode, {
							message: "Unauthorized: Refresh token not found",
						});
					case ElectronPostLoginErrorType.InvalidRefreshToken:
						error = this.httpErrors.error_401();
						return new HttpResponse(error.statusCode, {
							message: "Unauthorized: Invalid refresh token",
						});
					case ElectronPostLoginErrorType.RefreshTokenBlacklisted:
						error = this.httpErrors.error_401();
						return new HttpResponse(error.statusCode, {
							message: "Unauthorized: Refresh token blacklisted",
						});
					case ElectronPostLoginErrorType.UserNotFound:
						error = this.httpErrors.error_401();
						return new HttpResponse(error.statusCode, {
							message: "Unauthorized: User not found",
						});
					case ElectronPostLoginErrorType.UserBanned:
						error = this.httpErrors.error_403();
						return new HttpResponse(error.statusCode, {
							message: "Forbidden: User is banned",
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
			logger.error("Error during Electron post-login token refresh:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
