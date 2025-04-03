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
import { IUpdatePromotionalVideoUseCase } from "@/app/use-cases/admin/promotionalVideo/IUpdatePromotionalVideoUseCase";
import { UpdatePromotionalVideoResponseDTO } from "@/domain/dtos/admin/promotionalVideo/UpdatePromotionalVideoResponseDTO";
import { UpdatePromotionalVideoDTO } from "@/domain/dtos/admin/promotionalVideo/UpdatePromotionalVideoDTO";
import { UpdatePromotionalVideoErrorType } from "@/domain/enums/Admin/PromotionalVideo/UpdatePromotionalVideoErrorType";

@injectable()
export class UpdatePromotionalVideoController implements IController {
  constructor(
    @inject(TOKENS.UpdatePromotionalVideoUseCase)
    private readonly updatePromotionalVideoUseCase: IUpdatePromotionalVideoUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & { data: UpdatePromotionalVideoResponseDTO | { error: string } };

    try {

      const { id } = httpRequest.params as { id?: string };
      const {
        category,
        hidden,
        priority,
        startDate,
        endDate,
        title,
        description,
        createdBy,
      } = httpRequest.body as {
        category?: string;
        hidden?: string | boolean;
        priority?: string;
        startDate?: string;
        endDate?: string;
        title?: string;
        description?: string;
        createdBy?: string;
      };

      const dto: UpdatePromotionalVideoDTO = {
        id: id || "",
        category,
        hidden: hidden !== undefined ? (hidden === "true" || hidden === true) : undefined,
        priority: priority !== undefined ? parseInt(priority, 10) : undefined,
        startDate,
        endDate,
        title,
        description,
        createdBy,
      };

      response = await this.updatePromotionalVideoUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case UpdatePromotionalVideoErrorType.VideoNotFound:
            error = this.httpErrors.error_404();
            return new HttpResponse(error.statusCode, { error: "Promotional video not found" });
          case UpdatePromotionalVideoErrorType.InternalError:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, { error: "Internal server error" });
          default:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, { error: "Internal server error" });
        }
      }

      const success = this.httpSuccess.success_200(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error(`Error in UpdatePromotionalVideoController for id ${httpRequest.params?.id}:`, {
        message: err.message,
        stack: err.stack,
      });
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, { error: err.message });
    }
  }
}