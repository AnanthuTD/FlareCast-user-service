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
import { ISignUpUseCase } from "@/app/use-cases/auth/ISignUpUseCase";
import { SignUpDTO } from "@/domain/dtos/authenticate/SignUpDTO";
import { SignUpErrorType } from "@/domain/enums/Authenticate/SignUpErrorType";

/**
 * Controller for handling user sign-up requests.
 */
@injectable()
export class SignUpController implements IController {
	constructor(
		@inject(TOKENS.SignUpUseCase)
		private readonly signUpUseCase: ISignUpUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		try {
			// Extract and validate request body
			const { email, password, firstName, lastName, image } =
				httpRequest.body as {
					email: string;
					password: string;
					firstName: string;
					lastName: string;
					image?: string;
				};

			// Create DTO and call the use case
			const dto: SignUpDTO = { email, password, firstName, lastName, image };
			response = await this.signUpUseCase.execute(dto);

			if (!response.success) {
				const errorType = response.data.error as string;
				switch (errorType) {
					case SignUpErrorType.MissingRequiredFields:
						error = this.httpErrors.badRequest();
						return new HttpResponse(error.statusCode, {
							message:
								"Email, password, first name, and last name are required",
						});
					case SignUpErrorType.UserAlreadyExists:
						error = this.httpErrors.badRequest();
						return new HttpResponse(error.statusCode, {
							message: "User already exists",
						});
					case SignUpErrorType.FailedToCreateUser:
						error = this.httpErrors.internalServerError();
						return new HttpResponse(error.statusCode, {
							message: "Failed to create user",
						});
					case SignUpErrorType.FailedToPublishEvent:
						error = this.httpErrors.internalServerError();
						return new HttpResponse(error.statusCode, {
							message: "Failed to publish user created event",
						});
					default:
						error = this.httpErrors.internalServerError();
						return new HttpResponse(error.statusCode, {
							message: "Internal server error",
						});
				}
			}

			// Return the response
			const success = this.httpSuccess.created(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err: any) {
			logger.error("Error during user sign-up:", err);
			error = this.httpErrors.internalServerError();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
