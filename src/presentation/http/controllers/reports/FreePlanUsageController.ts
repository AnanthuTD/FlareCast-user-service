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

interface FreePlanUsageDTO {
  count: number;
  plan: { id: string; name: string; type: string } | null;
}

@injectable()
export class FreePlanUsageController implements IController {
  constructor(
   @inject(TOKENS.UserSubscriptionRepository)
       private readonly subscriptionService: IUserSubscriptionRepository,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & { data: FreePlanUsageDTO | { error: string } };

    try {
      const freePlan = await this.subscriptionService.freePlanUsage();
      response = this.httpSuccess.ok(freePlan);
      return new HttpResponse(response.statusCode, response.body);
    } catch (err: any) {
      logger.error(`Error in FreePlanUsageController:`, {
        message: err.message,
        stack: err.stack,
      });
      error = this.httpErrors.internalServerError();
      return new HttpResponse(error.statusCode, { error: err.message });
    }
  }
}