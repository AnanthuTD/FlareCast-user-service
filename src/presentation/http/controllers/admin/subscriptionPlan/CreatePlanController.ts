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
import { ICreatePlanUseCase } from "@/app/use-cases/admin/subscriptionPlan/ICreatePlanUseCase";
import { CreatePlanResponseDTO } from "@/domain/dtos/admin/subscriptionPlan/CreatePlanResponseDTO";
import { CreatePlanDTO } from "@/domain/dtos/admin/subscriptionPlan/CreatePlanDTO";
import { CreatePlanErrorType } from "@/domain/enums/Admin/SubscriptionPlan/CreatePlanErrorType";

@injectable()
export class CreatePlanController implements IController {
  constructor(
    @inject(TOKENS.CreatePlanUseCase)
    private readonly createPlanUseCase: ICreatePlanUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & { data: CreatePlanResponseDTO | { error: string } };

    try {
      const {
        type,
        name,
        price,
        interval,
        period,
        maxRecordingDuration,
        hasAiFeatures,
        hasAdvancedEditing,
        maxMembers,
        maxVideoCount,
        maxWorkspaces,
        isActive,
      } = httpRequest.body as {
        type?: string;
        name?: string;
        price?: number;
        interval?: number;
        period?: string;
        maxRecordingDuration?: number;
        hasAiFeatures?: boolean;
        hasAdvancedEditing?: boolean;
        maxMembers?: number;
        maxVideoCount?: number;
        maxWorkspaces?: number;
        isActive?: boolean;
      };

      const dto: CreatePlanDTO = {
        type: type || "paid",
        name: name || "",
        price,
        interval,
        period,
        maxRecordingDuration,
        hasAiFeatures,
        hasAdvancedEditing,
        maxMembers,
        maxVideoCount,
        maxWorkspaces,
        isActive,
      };

      response = await this.createPlanUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case CreatePlanErrorType.MissingName:
            error = this.httpErrors.badRequest();
            return new HttpResponse(error.statusCode, { error: "Plan name is required" });
          case CreatePlanErrorType.MissingPaidPlanFields:
            error = this.httpErrors.badRequest();
            return new HttpResponse(error.statusCode, { error: "Price, interval, and period are required for paid plans" });
          case CreatePlanErrorType.InvalidPeriod:
            error = this.httpErrors.badRequest();
            return new HttpResponse(error.statusCode, { error: "Invalid period" });
          case CreatePlanErrorType.ActiveFreePlanExists:
            error = this.httpErrors.badRequest();
            return new HttpResponse(error.statusCode, { error: "Another active free plan exists" });
          case CreatePlanErrorType.RazorpayError:
          case CreatePlanErrorType.InternalError:
            error = this.httpErrors.internalServerError();
            return new HttpResponse(error.statusCode, { error: "Failed to create subscription plan" });
          default:
            error = this.httpErrors.internalServerError();
            return new HttpResponse(error.statusCode, { error: "Internal server error" });
        }
      }

      const success = this.httpSuccess.created(response.data.plan);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error("Error in CreatePlanController:", {
        message: err.message,
        stack: err.stack,
      });
      error = this.httpErrors.internalServerError();
      return new HttpResponse(error.statusCode, { error: "Failed to create subscription plan" });
    }
  }
}