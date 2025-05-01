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
import { IGetSignedUrlUseCase } from "@/app/use-cases/admin/promotionalVideo/IGetSignedUrlUseCase";
import { GetSignedUrlResponseDTO } from "@/domain/dtos/admin/promotionalVideo/GetSignedUrlResponseDTO";
import { GetSignedUrlDTO } from "@/domain/dtos/admin/promotionalVideo/GetSignedUrlDTO";
import { GetSignedUrlErrorType } from "@/domain/enums/Admin/PromotionalVideo/GetSignedUrlErrorType";
import { PromotionalVideoCategory } from "@/domain/entities/PromotionalVideo";

@injectable()
export class GetSignedUrlController implements IController {
	constructor(
		@inject(TOKENS.GetSignedUrlUseCase)
		private readonly getSignedUrlUseCase: IGetSignedUrlUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO & {
			data: GetSignedUrlResponseDTO | { error: string };
		};

		try {
			const { title, description, fileName, category } = httpRequest.body as {
				title?: string;
				description?: string;
				fileName?: string;
				category?: PromotionalVideoCategory;
			};

			const dto: GetSignedUrlDTO = {
				title,
				description,
				fileName: fileName || "",
				category: category || PromotionalVideoCategory.PROMOTIONAL,
			};

			response = await this.getSignedUrlUseCase.execute(dto);

			if (!response.success) {
				const errorType = response.data.error as string;
				switch (errorType) {
					case GetSignedUrlErrorType.MissingFileName:
						error = this.httpErrors.badRequest();
						return new HttpResponse(error.statusCode, {
							error: "fileName is required",
						});
					case GetSignedUrlErrorType.InvalidVideoExtension:
						error = this.httpErrors.badRequest();
						return new HttpResponse(error.statusCode, {
							error: "Invalid video extension. Use mp4 or webm",
						});
					case GetSignedUrlErrorType.VideoServiceError:
					case GetSignedUrlErrorType.InternalError:
						error = this.httpErrors.internalServerError();
						return new HttpResponse(error.statusCode, {
							error: "Failed to fetch signed URL",
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
			logger.error("Error in GetSignedUrlController:", {
				message: err.message,
				stack: err.stack,
			});
			error = this.httpErrors.internalServerError();
			return new HttpResponse(error.statusCode, {
				error: "Internal server error",
			});
		}
	}
}
