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
import { IUploadPromotionalVideoUseCase } from "@/app/use-cases/admin/promotionalVideo/IUploadPromotionalVideoUseCase";
import { UploadPromotionalVideoResponseDTO } from "@/domain/dtos/admin/promotionalVideo/UploadPromotionalVideoResponseDTO";
import { UploadPromotionalVideoDTO } from "@/domain/dtos/admin/promotionalVideo/UploadPromotionalVideoDTO";
import { UploadPromotionalVideoErrorType } from "@/domain/enums/Admin/PromotionalVideo/UploadPromotionalVideoErrorType";

@injectable()
export class UploadPromotionalVideoController implements IController {
	constructor(
		@inject(TOKENS.UploadPromotionalVideoUseCase)
		private readonly uploadPromotionalVideoUseCase: IUploadPromotionalVideoUseCase,
		@inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO & {
			data: UploadPromotionalVideoResponseDTO | { error: string };
		};

		try {
			const {
				category,
				hidden = "true",
				priority = "0",
				startDate,
				endDate,
				title,
				description,
				videoId,
				s3Key,
			} = httpRequest.body as {
				category?: string;
				hidden?: string | boolean;
				priority?: string;
				startDate?: string;
				endDate?: string;
				title?: string;
				description?: string;
				videoId?: string;
				s3Key?: string;
			};

			const dto: UploadPromotionalVideoDTO = {
				category: category || "",
				hidden: hidden === "true" || hidden === true,
				priority: parseInt(priority, 10),
				startDate,
				endDate,
				title,
				description,
				videoId: videoId || "",
				s3Key: s3Key || "",
				createdBy: httpRequest.user.id || "defaultAdminId",
			};

			response = await this.uploadPromotionalVideoUseCase.execute(dto);

			if (!response.success) {
				const errorType = response.data.error as string;
				switch (errorType) {
					case UploadPromotionalVideoErrorType.MissingRequiredFields:
						error = this.httpErrors.error_400();
						return new HttpResponse(error.statusCode, {
							error: "videoId and s3Key are required",
						});
					case UploadPromotionalVideoErrorType.InvalidCategory:
						error = this.httpErrors.error_400();
						return new HttpResponse(error.statusCode, {
							error: "Invalid category",
						});
					case UploadPromotionalVideoErrorType.InvalidPriority:
						error = this.httpErrors.error_400();
						return new HttpResponse(error.statusCode, {
							error: "Priority must be a number",
						});
					case UploadPromotionalVideoErrorType.InternalError:
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

			const success = this.httpSuccess.success_201(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err: any) {
			logger.error("Error in UploadPromotionalVideoController:", {
				message: err.message,
				stack: err.stack,
			});
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, { error: err.message });
		}
	}
}
