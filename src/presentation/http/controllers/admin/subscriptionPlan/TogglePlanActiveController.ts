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
import { ITogglePlanActiveUseCase } from "@/app/use-cases/admin/subscriptionPlan/ITogglePlanActiveUseCase";
import { TogglePlanActiveResponseDTO } from "@/domain/dtos/admin/subscriptionPlan/TogglePlanActiveResponseDTO";
import { TogglePlanActiveDTO } from "@/domain/dtos/admin/subscriptionPlan/TogglePlanActiveDTO";
import { TogglePlanActiveErrorType } from "@/domain/enums/Admin/SubscriptionPlan/TogglePlanActiveErrorType";

@injectable()
export class TogglePlanActiveController implements IController {
  constructor(
    @inject(TOKENS.TogglePlanActiveUseCase)
    private readonly togglePlanActiveUseCase: ITogglePlanActiveUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & { data: TogglePlanActiveResponseDTO | { error: string } };

    try {
      const { id } = httpRequest.params as { id?: string };
      const { isActive } = httpRequest.body as { isActive?: boolean };

      const dto: TogglePlanActiveDTO = {
        id: id || "",
        isActive,
      };

      response = await this.togglePlanActiveUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case TogglePlanActiveErrorType.PlanNotFound:
            error = this.httpErrors.error_404();
            return new HttpResponse(error.statusCode, { error: "Subscription plan not found" });
          case TogglePlanActiveErrorType.ActiveFreePlanExists:
            error = this.httpErrors.error_400();
            return new HttpResponse(error.statusCode, { error: "Another free plan is already active" });
          case TogglePlanActiveErrorType.InternalError:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, { error: "Failed to toggle plan status" });
          default:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, { error: "Internal server error" });
        }
      }

      const success = this.httpSuccess.success_200(response.data.plan);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error(`Error in TogglePlanActiveController for id ${httpRequest.params?.id}:`, {
        message: err.message,
        stack: err.stack,
      });
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, { error: "Failed to toggle plan status" });
    }
  }
}