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
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";

interface PlanGroupDTO {
  planId: string;
  count: number;
  totalAmount: number;
  planName: string;
  planPrice: number;
  planType: string;
}

@injectable()
export class PlanGroupController implements IController {
  constructor(
    @inject(TOKENS.UserSubscriptionRepository)
    private readonly subscriptionService: IUserSubscriptionRepository,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & { data: PlanGroupDTO[] | { error: string } };

    try {
      const planGroup = await this.subscriptionService.groupByPlan();
      response = this.httpSuccess.success_200(planGroup);
      return new HttpResponse(response.statusCode, response.body);
    } catch (err: any) {
      logger.error(`Error in PlanGroupController:`, {
        message: err.message,
        stack: err.stack,
      });
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, { error: err.message });
    }
  }
}