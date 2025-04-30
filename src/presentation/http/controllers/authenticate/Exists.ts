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
import { IUserExistUseCase } from "@/app/use-cases/user/IUserExistUseCase";
import { UserExistDTO } from "@/domain/dtos/User/UserExistDTO";
import { UserExistErrorType } from "@/domain/enums/user/UserExistErrorType";

/**
 * Controller for checking if a user exists by email.
 */
@injectable()
export class UserExistController implements IController {
  constructor(
    @inject(TOKENS.UserExistUseCase)
    private readonly userExistUseCase: IUserExistUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO;

    // Extract and validate the email from the query
    const email = httpRequest.query?.email as string;
    if (!email) {
      error = this.httpErrors.badRequest();
      return new HttpResponse(error.statusCode, {
        message: "Email is required",
      });
    }

    try {
      // Create DTO and call the use case
      const dto: UserExistDTO = { email };
      response = await this.userExistUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        if (errorType === UserExistErrorType.InvalidEmail) {
          error = this.httpErrors.badRequest();
          return new HttpResponse(error.statusCode, {
            message: "Invalid email format",
          });
        }
        error = this.httpErrors.internalServerError();
        return new HttpResponse(error.statusCode, {
          message: "Internal server error",
        });
      }

      // Return the response
      const success = this.httpSuccess.ok(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error("Error checking if user exists:", err);
      error = this.httpErrors.internalServerError();
      return new HttpResponse(error.statusCode, {
        message: "Internal server error",
      });
    }
  }
}