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
import { IDeletePromotionalVideoUseCase } from "@/app/use-cases/admin/promotionalVideo/IDeletePromotionalVideoUseCase";
import { DeletePromotionalVideoResponseDTO } from "@/domain/dtos/admin/promotionalVideo/DeletePromotionalVideoResponseDTO";
import { DeletePromotionalVideoDTO } from "@/domain/dtos/admin/promotionalVideo/DeletePromotionalVideoDTO";
import { DeletePromotionalVideoErrorType } from "@/domain/enums/Admin/PromotionalVideo/DeletePromotionalVideoErrorType";

@injectable()
export class DeletePromotionalVideoController implements IController {
  constructor(
    @inject(TOKENS.DeletePromotionalVideoUseCase)
    private readonly deletePromotionalVideoUseCase: IDeletePromotionalVideoUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & { data: DeletePromotionalVideoResponseDTO | { error: string } };

    try {
      const { id } = httpRequest.params as { id?: string };

      const dto: DeletePromotionalVideoDTO = {
        id: id || "",
      };

      response = await this.deletePromotionalVideoUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case DeletePromotionalVideoErrorType.VideoNotFound:
            error = this.httpErrors.notFound();
            return new HttpResponse(error.statusCode, { error: "Promotional video not found" });
          case DeletePromotionalVideoErrorType.InternalError:
            error = this.httpErrors.internalServerError();
            return new HttpResponse(error.statusCode, { error: "Internal server error" });
          default:
            error = this.httpErrors.internalServerError();
            return new HttpResponse(error.statusCode, { error: "Internal server error" });
        }
      }

      const success = this.httpSuccess.ok(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error(`Error in DeletePromotionalVideoController for id ${httpRequest.params?.id}:`, {
        message: err.message,
        stack: err.stack,
      });
      error = this.httpErrors.internalServerError();
      return new HttpResponse(error.statusCode, { error: err.message });
    }
  }
}