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
import { IUpdateProfileUseCase } from "@/app/use-cases/user/IUpdateProfileUseCase";
import { UpdateProfileDTO } from "@/domain/dtos/user/UpdateProfileDTO";
import { UpdateProfileErrorType } from "@/domain/enums/User/UpdateProfileErrorType";

/**
 * Controller for handling user profile update requests.
 */
@injectable()
export class UpdateProfileController implements IController {
	constructor(
		@inject(TOKENS.UpdateProfileUseCase)
		private readonly updateProfileUseCase: IUpdateProfileUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		try {
			// Ensure user is authenticated
			if (!httpRequest.user || !httpRequest.user.id) {
				error = this.httpErrors.error_401();
				return new HttpResponse(error.statusCode, { message: "Unauthorized" });
			}

			// Extract data from the request
			const userId = httpRequest.user.id;
			const { firstName, lastName, password } = httpRequest.body as {
				firstName?: string;
				lastName?: string;
				password?: string;
			};

			// Create DTO and call the use case
			const dto: UpdateProfileDTO = {
				userId,
				firstName,
				lastName,
				password,
				file: httpRequest.file,
			};
			response = await this.updateProfileUseCase.execute(dto);

			if (!response.success) {
				const errorType = response.data.error as string;
				switch (errorType) {
					case UpdateProfileErrorType.MissingUserId:
						error = this.httpErrors.error_401();
						return new HttpResponse(error.statusCode, {
							message: "Unauthorized",
						});
					case UpdateProfileErrorType.UserNotFound:
						error = this.httpErrors.error_404();
						return new HttpResponse(error.statusCode, {
							message: "User not found",
						});
					case UpdateProfileErrorType.FailedToUploadImage:
						error = this.httpErrors.error_500();
						return new HttpResponse(error.statusCode, {
							message: "Failed to upload image",
						});
					case UpdateProfileErrorType.FailedToUpdateProfile:
						error = this.httpErrors.error_500();
						return new HttpResponse(error.statusCode, {
							message: "Failed to update profile",
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
			logger.error(
				`Failed to update profile for user ${httpRequest.user?.id}:`,
				err
			);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
