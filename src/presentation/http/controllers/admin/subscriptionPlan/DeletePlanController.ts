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
import { IDeletePlanUseCase } from "@/app/use-cases/admin/subscriptionPlan/IDeletePlanUseCase";
import { DeletePlanResponseDTO } from "@/domain/dtos/admin/subscriptionPlan/DeletePlanResponseDTO";
import { DeletePlanDTO } from "@/domain/dtos/admin/subscriptionPlan/DeletePlanDTO";
import { DeletePlanErrorType } from "@/domain/enums/Admin/SubscriptionPlan/DeletePlanErrorType";

@injectable()
export class DeletePlanController implements IController {
  constructor(
    @inject(TOKENS.DeletePlanUseCase)
    private readonly deletePlanUseCase: IDeletePlanUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & { data: DeletePlanResponseDTO | { error: string } };

    try {
      const { id } = httpRequest.params as { id?: string };

      const dto: DeletePlanDTO = {
        id: id || "",
      };

      response = await this.deletePlanUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case DeletePlanErrorType.PlanNotFound:
            error = this.httpErrors.notFound();
            return new HttpResponse(error.statusCode, { error: "Subscription plan not found" });
          case DeletePlanErrorType.PlanInUse:
            error = this.httpErrors.badRequest();
            return new HttpResponse(error.statusCode, { error: "Cannot delete plan with active subscriptions" });
          case DeletePlanErrorType.InternalError:
            error = this.httpErrors.internalServerError();
            return new HttpResponse(error.statusCode, { error: "Failed to delete subscription plan" });
          default:
            error = this.httpErrors.internalServerError();
            return new HttpResponse(error.statusCode, { error: "Internal server error" });
        }
      }

      const success = this.httpSuccess.ok(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error(`Error in DeletePlanController for id ${httpRequest.params?.id}:`, {
        message: err.message,
        stack: err.stack,
      });
      error = this.httpErrors.internalServerError();
      return new HttpResponse(error.statusCode, { error: "Failed to delete subscription plan" });
    }
  }
}