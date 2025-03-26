// backend/src/presentation/http/controllers/subscription/GetMemberLimit.ts
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
import { IGetMemberLimitUseCase } from "@/app/use-cases/subscription/IGetMemberLimitUseCase";
import { GetMemberLimitDTO } from "@/domain/dtos/subscription/GetMemberLimitDTO";
import { GetMemberLimitErrorType } from "@/domain/enums/Subscription/GetMemberLimitErrorType";

/**
 * Controller for fetching the member limit for a user.
 */
@injectable()
export class GetMemberLimitController implements IController {
  constructor(
    @inject(TOKENS.GetMemberLimitUseCase)
    private readonly getMemberLimitUseCase: IGetMemberLimitUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    try {
      // Extract user ID from request params
      const userId = httpRequest.params?.userId;

      // Create DTO and call the use case
      const dto: GetMemberLimitDTO = { userId };
      response = await this.getMemberLimitUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case GetMemberLimitErrorType.MissingUserId:
            error = this.httpErrors.error_400();
            return new HttpResponse(error.statusCode, {
              message: "User ID is required",
            });
          case GetMemberLimitErrorType.NoActiveSubscription:
            error = this.httpErrors.error_403();
            return new HttpResponse(error.statusCode, {
              message: `User ${userId} does not have an active subscription plan`,
            });
          default:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, {
              message: "Internal server error",
            });
        }
      }

      // Return the response
      const success = this.httpSuccess.success_200(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error("Error getting member limit:", err);
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, {
        message: "Internal server error",
      });
    }
  }
}