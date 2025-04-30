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
import { IRefreshTokenUseCase } from "@/app/use-cases/auth/IRefreshTokenUseCase";
import { RefreshTokenDTO } from "@/domain/dtos/authenticate/RefreshTokenDTO";
import { RefreshTokenErrorType } from "@/domain/enums/Admin/Authentication/RefreshTokenErrorType";

interface RefreshTokenRequestBody {
	refreshToken?: string;
}

/**
 * Controller for handling refresh token requests.
 */
@injectable()
export class AdminRefreshTokenController implements IController {
	constructor(
		@inject(TOKENS.AdminRefreshTokenUseCase)
		private readonly refreshTokenUseCase: IRefreshTokenUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		// Extract tokens
		const cookieAccessToken = httpRequest.cookies?.accessToken;
		const authHeader = (httpRequest.headers as { authorization })
			?.authorization;
		const bearerAccessToken = authHeader?.startsWith("Bearer ")
			? authHeader.split(" ")[1]
			: null;
		const cookieRefreshToken = httpRequest.cookies?.refreshToken;
		const body = httpRequest.body as RefreshTokenRequestBody;
		const bodyRefreshToken = body?.refreshToken;

		// Prioritize token sources (e.g., body > cookie for refresh token)
		const refreshToken = bodyRefreshToken || cookieRefreshToken;
		const accessToken = bearerAccessToken || cookieAccessToken;

		// Validate input
		if (!refreshToken) {
			const error = this.httpErrors.unauthorized();
			return new HttpResponse(error.statusCode, {
				message: "Unauthorized: No refresh token provided",
			});
		}

		try {
			// Create DTO and call the use case
			const dto: RefreshTokenDTO = { accessToken, refreshToken };
			response = await this.refreshTokenUseCase.execute(dto);

			if (!response.success) {
				const errorType = response.data.error as string;
				switch (errorType) {
					case RefreshTokenErrorType.MissingRefreshToken:
						error = this.httpErrors.unauthorized();
						return new HttpResponse(error.statusCode, {
							message: "Unauthorized: No refresh token",
						});
					case RefreshTokenErrorType.InvalidRefreshToken:
						error = this.httpErrors.unauthorized();
						return new HttpResponse(error.statusCode, {
							message: "Unauthorized: Invalid refresh token",
						});
					case RefreshTokenErrorType.RefreshTokenBlacklisted:
						error = this.httpErrors.unauthorized();
						return new HttpResponse(error.statusCode, {
							message: "Unauthorized: Refresh token is blacklisted",
						});
					case RefreshTokenErrorType.AdminNotFound:
						error = this.httpErrors.unauthorized();
						return new HttpResponse(error.statusCode, {
							message: "Unauthorized: Admin not found",
						});
					default:
						error = this.httpErrors.internalServerError();
						return new HttpResponse(error.statusCode, {
							message: "Internal server error",
						});
				}
			}

			// Return the response
			const success = this.httpSuccess.ok(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err: any) {
			logger.error("Error during refresh token handling:", err);
			error = this.httpErrors.internalServerError();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
