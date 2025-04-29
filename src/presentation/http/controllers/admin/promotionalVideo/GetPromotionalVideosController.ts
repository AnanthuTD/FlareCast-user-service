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
import { IGetPromotionalVideosUseCase } from "@/app/use-cases/admin/promotionalVideo/IGetPromotionalVideosUseCase";
import { GetPromotionalVideosResponseDTO } from "@/domain/dtos/admin/promotionalVideo/GetPromotionalVideosResponseDTO";
import { GetPromotionalVideosErrorType } from "@/domain/enums/Admin/PromotionalVideo/GetPromotionalVideosErrorType";

@injectable()
export class GetPromotionalVideosController implements IController {
	constructor(
		@inject(TOKENS.GetPromotionalVideosUseCase)
		private readonly getPromotionalVideosUseCase: IGetPromotionalVideosUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO & {
			data: GetPromotionalVideosResponseDTO | { error: string };
		};

		try {
			const { limit, skip } = httpRequest.query as {
				skip?: string;
				limit?: string;
			};

			response = await this.getPromotionalVideosUseCase.execute({
				limit: limit ? parseInt(limit) : undefined,
				skip: skip ? parseInt(skip) : 0,
			});

			if (!response.success) {
				const errorType = response.data.error as string;
				switch (errorType) {
					case GetPromotionalVideosErrorType.InternalError:
						error = this.httpErrors.error_500();
						return new HttpResponse(error.statusCode, {
							error: "Internal server error",
						});
					default:
						error = this.httpErrors.error_500();
						return new HttpResponse(error.statusCode, {
							error: "Internal server error",
						});
				}
			}

			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err: any) {
			logger.error("Error in GetPromotionalVideosController:", {
				message: err.message,
				stack: err.stack,
			});
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, { error: err.message });
		}
	}
}
