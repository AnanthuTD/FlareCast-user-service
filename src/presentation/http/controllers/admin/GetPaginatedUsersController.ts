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
import { IGetPaginatedUsersUseCase } from "@/app/use-cases/admin/IGetPaginatedUsersUseCase";
import { GetPaginatedUsersResponseDTO } from "@/domain/dtos/admin/GetPaginatedUsersResponseDTO";
import { GetPaginatedUsersErrorType } from "@/domain/enums/Admin/GetPaginatedUsersErrorType";
import { GetPaginatedUsersDTO } from "@/domain/dtos/admin/GetPaginatedUsersDTO";
/**
 * Controller for fetching paginated users.
 */
@injectable()
export class GetPaginatedUsersController implements IController {
  constructor(
    @inject(TOKENS.GetPaginatedUsersUseCase)
    private readonly getPaginatedUsersUseCase: IGetPaginatedUsersUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & { data: GetPaginatedUsersResponseDTO | { error: string } };

    try {
      // Extract query parameters
      const page = parseInt(httpRequest.query.page as string) || 1;
      const limit = parseInt(httpRequest.query.limit as string) || 10;
      const searchQuery = (httpRequest.query.q as string) || "";
      const includeBanned = httpRequest.query.includeBanned === "true";

      // Create DTO and call the use case
      const dto: GetPaginatedUsersDTO = {
        page,
        limit,
        searchQuery,
        includeBanned,
      };
      response = await this.getPaginatedUsersUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case GetPaginatedUsersErrorType.InvalidPaginationParams:
            error = this.httpErrors.error_400();
            return new HttpResponse(error.statusCode, {
              message: "Page and limit must be positive integers",
            });
          case GetPaginatedUsersErrorType.InternalError:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, {
              message: "Internal server error",
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
      logger.error("Error in GetPaginatedUsersController:", {
        message: err.message,
        stack: err.stack,
      });
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, {
        message: "Internal server error",
      });
    }
  }
}