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
import { IGetPaginatedPaymentsUseCase } from "@/app/use-cases/admin/monetization/IGetPaginatedPaymentsUseCase";
import { GetPaginatedPaymentsResponseDTO } from "@/domain/dtos/admin/monetization/GetPaginatedPaymentsResponseDTO";
import { GetPaginatedPaymentsDTO } from "@/domain/dtos/admin/monetization/GetPaginatedPaymentsDTO";

@injectable()
export class GetPaginatedPaymentsController implements IController {
	constructor(
		@inject(TOKENS.GetPaginatedPaymentsUseCase)
		private readonly getPaginatedPaymentsUseCase: IGetPaginatedPaymentsUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO & {
			data: GetPaginatedPaymentsResponseDTO | { error: string };
		};

		try {
			const { limit, page, status } = httpRequest.query as {
				limit: string;
				page: string;
				status: string;
			};

			const dto: GetPaginatedPaymentsDTO = {
				limit: parseInt(limit),
				skip: (parseInt(page) - 1) * parseInt(limit),
				status,
			};

			response = await this.getPaginatedPaymentsUseCase.execute(dto);

			if (!response.success) {
				const errorType = response.data.error as string;
				switch (errorType) {
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
			logger.error(
				`Error in GetPaginatedPaymentsController:`,
				{
					message: err.message,
					stack: err.stack,
				}
			);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, { error: err.message });
		}
	}
}
