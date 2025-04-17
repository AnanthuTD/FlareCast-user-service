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

interface RevenueByPeriodDTO {
  period: string;
  totalRevenue: number;
  subscriptionCount: number;
}

@injectable()
export class RevenueByPeriodController implements IController {
  constructor(
    @inject(TOKENS.UserSubscriptionRepository)
    private readonly subscriptionService: IUserSubscriptionRepository,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & { data: RevenueByPeriodDTO[] | { error: string } };

    try {
      const period = (httpRequest.query.period as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly';
      if (!['daily', 'weekly', 'monthly', 'yearly'].includes(period)) {
        error = this.httpErrors.error_400('Invalid period parameter');
        return new HttpResponse(error.statusCode, { error: 'Invalid period parameter' });
      }
      const revenue = await this.subscriptionService.revenueByPeriod(period);
      response = this.httpSuccess.success_200(revenue);
      return new HttpResponse(response.statusCode, response.body);
    } catch (err: any) {
      logger.error(`Error in RevenueByPeriodController:`, {
        message: err.message,
        stack: err.stack,
      });
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, { error: err.message });
    }
  }
}