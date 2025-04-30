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
import { GetPaginatedPaymentsResponseDTO } from "@/domain/dtos/admin/monetization/GetPaginatedPaymentsResponseDTO";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";

@injectable()
export class GetSubscriptionStatusController implements IController {
  constructor(
    @inject(TOKENS.UserSubscriptionRepository)
    private readonly userSubscriptionRepository: IUserSubscriptionRepository,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & {
      data: GetPaginatedPaymentsResponseDTO | { error: string };
    };

    try {
      const status = await this.userSubscriptionRepository.getStatus();

      const success = this.httpSuccess.ok(status);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error(
        `Error in GetPaginatedPaymentsController:`,
        {
          message: err.message,
          stack: err.stack,
        }
      );
      error = this.httpErrors.internalServerError();
      return new HttpResponse(error.statusCode, { error: err.message });
    }
  }
}
