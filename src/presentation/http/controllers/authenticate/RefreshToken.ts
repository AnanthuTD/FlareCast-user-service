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
import { RefreshTokenErrorType } from "@/domain/enums/Authenticate/RefreshTokenErrorType";

// Define expected request body structure
interface RefreshTokenRequestBody {
	refreshToken?: string;
}

/**
 * Controller for handling refresh token requests.
 */
@injectable()
export class RefreshTokenController implements IController {
	constructor(
		@inject(TOKENS.RefreshTokenUseCase)
		private readonly refreshTokenUseCase: IRefreshTokenUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		try {
			// Extract tokens
			const cookieAccessToken = httpRequest.cookies?.accessToken;
			const authHeader = (httpRequest.headers as { authorization })?.authorization;
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
				const error = this.httpErrors.error_401();
				return new HttpResponse(error.statusCode, {
					message: "Unauthorized: No refresh token provided",
				});
			}

			// Create DTO and call the use case
			const dto: RefreshTokenDTO = { accessToken, refreshToken };
			const response = await this.refreshTokenUseCase.execute(dto);

			if (!response.success) {
				const errorType = response.data?.error as
					| RefreshTokenErrorType
					| undefined;
				return this.handleError(errorType);
			}

			// Return success response
			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err: any) {
			logger.error("Error during refresh token handling", {
				error: err.message,
				stack: err.stack,
			});
			const error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}

	private handleError(errorType?: RefreshTokenErrorType): IHttpResponse {
		const errorMap: Record<
			RefreshTokenErrorType,
			{ status: number; message: string }
		> = {
			[RefreshTokenErrorType.MissingRefreshToken]: {
				status: this.httpErrors.error_401().statusCode,
				message: "Unauthorized: No refresh token",
			},
			[RefreshTokenErrorType.InvalidRefreshToken]: {
				status: this.httpErrors.error_401().statusCode,
				message: "Unauthorized: Invalid refresh token",
			},
			[RefreshTokenErrorType.RefreshTokenBlacklisted]: {
				status: this.httpErrors.error_401().statusCode,
				message: "Unauthorized: Token is invalid",
			},
			[RefreshTokenErrorType.UserNotFound]: {
				status: this.httpErrors.error_401().statusCode,
				message: "Unauthorized: User not found",
			},
			[RefreshTokenErrorType.UserBanned]: {
				status: this.httpErrors.error_403().statusCode,
				message: "Forbidden: User is banned",
			},
		};

		const errorDetails = errorMap[errorType!] || {
			status: this.httpErrors.error_500().statusCode,
			message: "Internal server error",
		};

		return new HttpResponse(errorDetails.status, {
			message: errorDetails.message,
		});
	}
}
