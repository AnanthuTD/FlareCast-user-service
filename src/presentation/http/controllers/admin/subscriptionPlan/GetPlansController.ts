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
import { IGetPlansUseCase } from "@/app/use-cases/admin/subscriptionPlan/IGetPlansUseCase";
import { GetPlansResponseDTO } from "@/domain/dtos/admin/subscriptionPlan/GetPlansResponseDTO";
import { GetPlansErrorType } from "@/domain/enums/Admin/SubscriptionPlan/GetPlansErrorType";

@injectable()
export class GetAdminPlansController implements IController {
	constructor(
		@inject(TOKENS.GetAdminPlansUseCase)
		private readonly getPlansUseCase: IGetPlansUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO & {
			data: GetPlansResponseDTO | { error: string };
		};

		try {
			const {
				limit,
				skip,
				status = "active",
			} = httpRequest.query as {
				skip?: string;
				limit?: string;
				status?: "active" | "inactive" | "all";
			};

			response = await this.getPlansUseCase.execute({
				limit: limit ? parseInt(limit) : undefined,
				skip: skip ? parseInt(skip) : 0,
				status,
			});

			if (!response.success) {
				const errorType = response.data.error as string;
				switch (errorType) {
					case GetPlansErrorType.InternalError:
						error = this.httpErrors.internalServerError();
						return new HttpResponse(error.statusCode, {
							error: "Failed to fetch subscription plans",
						});
					default:
						error = this.httpErrors.internalServerError();
						return new HttpResponse(error.statusCode, {
							error: "Internal server error",
						});
				}
			}

			const success = this.httpSuccess.ok(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err: any) {
			logger.error("Error in GetPlansController:", {
				message: err.message,
				stack: err.stack,
			});
			error = this.httpErrors.internalServerError();
			return new HttpResponse(error.statusCode, {
				error: "Failed to fetch subscription plans",
			});
		}
	}
}
