import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpErrors } from "@/presentation/http/helpers/implementations/HttpErrors";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { HttpSuccess } from "@/presentation/http/helpers/implementations/HttpSuccess";
import { IController } from "@/presentation/http/controllers/IController";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { Service, Container, Inject } from "typedi";
import { TOKENS } from "@/app/tokens";

/**
 * Controller for checking if a user exists by email.
 */
export class UserExistController implements IController {
	constructor(
		@Inject(TOKENS.UserRepository)
		private readonly usersRepository: IUsersRepository,
		@Inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@Inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		const email = httpRequest.query?.email as string;
		if (!email) {
			error = this.httpErrors.error_400();
			return new HttpResponse(error.statusCode, {
				message: "Email is required",
			});
		}

		try {
			const exists = await this.usersRepository.userExists(email);
			response = {
				success: true,
				data: {
					exists,
				},
			};
			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.error("Error checking if user exists:", err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Internal server error",
			});
		}
	}
}
