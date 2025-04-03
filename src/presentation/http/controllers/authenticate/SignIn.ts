// backend/src/presentation/http/controllers/authenticate/SignIn.ts
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
import { IUserLoginUseCase } from "@/app/use-cases/auth/IUserLoginUseCase";
import { UserLoginDTO } from "@/domain/dtos/authenticate/UserLoginDTO";
import { UserLoginErrorType } from "@/domain/enums/Authenticate/UserLoginErrorType";

/**
 * Controller for handling user login requests.
 */
@injectable()
export class UserLoginController implements IController {
	constructor(
		@inject(TOKENS.UserLoginUseCase)
		private readonly userLoginUseCase: IUserLoginUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		try {
			// Create DTO and call the use case
			const dto: UserLoginDTO = httpRequest.body;
			response = await this.userLoginUseCase.execute(dto);

			if (!response.success) {
				const errorType = response.data.error as string;
				switch (errorType) {
					case UserLoginErrorType.UserNotFound:
						error = this.httpErrors.error_404();
						return new HttpResponse(error.statusCode, {
							message: "User not found",
						});
					case UserLoginErrorType.UserBanned:
						error = this.httpErrors.error_403();
						return new HttpResponse(error.statusCode, {
							message: "User is banned",
						});
					case UserLoginErrorType.UserNotVerified:
						error = this.httpErrors.error_401();
						return new HttpResponse(error.statusCode, {
							message: "User not verified",
						});
					case UserLoginErrorType.FailedToVerifyUser:
						error = this.httpErrors.error_500();
						return new HttpResponse(error.statusCode, {
							message: "Failed to verify user status",
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
			logger.error("Error during user login:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
