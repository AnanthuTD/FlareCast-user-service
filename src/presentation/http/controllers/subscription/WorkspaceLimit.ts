import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { Service, Inject } from "typedi";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { TOKENS } from "@/app/tokens";

/**
 * Controller for fetching the workspace limit for a user.
 */
export class GetWorkspaceLimitController implements IController {
  constructor(
    @Inject(TOKENS.UserSubscriptionRepository) private readonly userSubscriptionRepository: IUserSubscriptionRepository,
    @Inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @Inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess,
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    const userId = httpRequest.params?.userId;
    if (!userId) {
      error = this.httpErrors.error_400();
      return new HttpResponse(error.statusCode, { message: "User ID is required" });
    }

    try {
      const activePlan = await this.userSubscriptionRepository.getActiveSubscription(userId);
      if (!activePlan) {
        error = this.httpErrors.error_403();
        return new HttpResponse(error.statusCode, { message: `User ${userId} does not have an active subscription plan` });
      }

      response = {
        success: true,
        data: {
          message: "Workspace limit",
          limit: activePlan.maxWorkspaces,
        },
      };
      const success = this.httpSuccess.success_200(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err) {
      logger.error("Error getting workspace limit:", err);
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, { message: "Internal server error" });
    }
  }
}