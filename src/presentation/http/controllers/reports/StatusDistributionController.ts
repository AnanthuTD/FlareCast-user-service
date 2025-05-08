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

interface StatusDistributionDTO {
  _id: string;
  count: number;
}

@injectable()
export class StatusDistributionController implements IController {
  constructor(
    @inject(TOKENS.UserSubscriptionRepository)
    private readonly subscriptionService: IUserSubscriptionRepository,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & { data: StatusDistributionDTO[] | { error: string } };

    try {
      const statusDist = await this.subscriptionService.statusDistribution();
      response = this.httpSuccess.ok(statusDist);
      return new HttpResponse(response.statusCode, response.body);
    } catch (err: any) {
      logger.error(`Error in StatusDistributionController:`, {
        message: err.message,
        stack: err.stack,
      });
      error = this.httpErrors.internalServerError();
      return new HttpResponse(error.statusCode, { error: err.message });
    }
  }
}