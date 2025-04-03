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
import { IBanUserUseCase } from "@/app/use-cases/admin/IBanUserUseCase";
import { BanUserResponseDTO } from "@/domain/dtos/admin/BanUserResponseDTO";
import { BanUserDTO } from "@/domain/dtos/admin/BanUserDTO";
import { BanUserErrorType } from "@/domain/enums/Admin/BanUserErrorType";

/**
 * Controller for banning or unbanning a user.
 */
@injectable()
export class BanUserController implements IController {
  constructor(
    @inject(TOKENS.BanUserUseCase)
    private readonly banUserUseCase: IBanUserUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & { data: BanUserResponseDTO | { error: string } };

    try {
      // Extract user ID and ban status from the request
      const { id } = httpRequest.params as { id?: string };
      const { isBanned } = httpRequest.body as { isBanned?: boolean };

      // Create DTO and call the use case
      const dto: BanUserDTO = { userId: id || "", isBanned: isBanned ?? false };
      response = await this.banUserUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case BanUserErrorType.InvalidInput:
            error = this.httpErrors.error_400();
            return new HttpResponse(error.statusCode, {
              message: "Invalid input: userId and isBanned (boolean) are required",
            });
          case BanUserErrorType.UserNotFound:
            error = this.httpErrors.error_404();
            return new HttpResponse(error.statusCode, {
              message: "User not found",
            });
          case BanUserErrorType.InternalError:
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
      logger.error(`Error in BanUserController for user ${httpRequest.params?.id}:`, {
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