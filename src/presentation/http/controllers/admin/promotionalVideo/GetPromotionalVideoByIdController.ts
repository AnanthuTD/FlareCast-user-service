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
import { IGetPromotionalVideoByIdUseCase } from "@/app/use-cases/admin/promotionalVideo/IGetPromotionalVideoByIdUseCase";
import { GetPromotionalVideoByIdResponseDTO } from "@/domain/dtos/admin/promotionalVideo/GetPromotionalVideoByIdResponseDTO";
import { GetPromotionalVideoByIdDTO } from "@/domain/dtos/admin/promotionalVideo/GetPromotionalVideoByIdDTO";
import { GetPromotionalVideoByIdErrorType } from "@/domain/enums/Admin/PromotionalVideo/GetPromotionalVideoByIdErrorType";

@injectable()
export class GetPromotionalVideoByIdController implements IController {
  constructor(
    @inject(TOKENS.GetPromotionalVideoByIdUseCase)
    private readonly getPromotionalVideoByIdUseCase: IGetPromotionalVideoByIdUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & { data: GetPromotionalVideoByIdResponseDTO | { error: string } };

    try {
      const { id } = httpRequest.params as { id?: string };

      const dto: GetPromotionalVideoByIdDTO = {
        id: id || "",
      };

      response = await this.getPromotionalVideoByIdUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case GetPromotionalVideoByIdErrorType.VideoNotFound:
            error = this.httpErrors.error_404();
            return new HttpResponse(error.statusCode, { error: "Promotional video not found" });
          case GetPromotionalVideoByIdErrorType.InternalError:
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
      logger.error(`Error in GetPromotionalVideoByIdController for id ${httpRequest.params?.id}:`, {
        message: err.message,
        stack: err.stack,
      });
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, { error: err.message });
    }
  }
}