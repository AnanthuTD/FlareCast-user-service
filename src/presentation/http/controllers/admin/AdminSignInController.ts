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
import { IAdminSignInUseCase } from "@/app/use-cases/admin/IAdminSignInUseCase";
import { AdminSignInResponseDTO } from "@/domain/dtos/admin/authentication/AdminSignInResponseDTO";
import { AdminSignInDTO } from "@/domain/dtos/admin/authentication/AdminSignInDTO";
import { AdminSignInErrorType } from "@/domain/enums/Admin/Authentication/AdminSignInErrorType";

/**
 * Controller for handling admin sign-in requests.
 */
@injectable()
export class AdminSignInController implements IController {
  constructor(
    @inject(TOKENS.AdminSignInUseCase)
    private readonly adminSignInUseCase: IAdminSignInUseCase,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & {
      data: AdminSignInResponseDTO & { tokens?: { accessToken: string; refreshToken: string } } | { error: string };
    };

    try {
      // Extract email and password from the request body
      const { email, password } = httpRequest.body as { email?: string; password?: string };

      // Create DTO and call the use case
      const dto: AdminSignInDTO = { email: email || "", password: password || "" };
      response = await this.adminSignInUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case AdminSignInErrorType.MissingCredentials:
            error = this.httpErrors.badRequest();
            return new HttpResponse(error.statusCode, {
              message: "Email and password are required",
            });
          case AdminSignInErrorType.InvalidCredentials:
            error = this.httpErrors.unauthorized();
            return new HttpResponse(error.statusCode, {
              message: "Invalid credentials",
            });
          case AdminSignInErrorType.InternalError:
            error = this.httpErrors.internalServerError();
            return new HttpResponse(error.statusCode, {
              message: "Internal server error",
            });
          default:
            error = this.httpErrors.internalServerError();
            return new HttpResponse(error.statusCode, {
              message: "Internal server error",
            });
        }
      }

      // Return the response
      const success = this.httpSuccess.ok(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error("Error in AdminSignInController:", {
        message: err.message,
        stack: err.stack,
      });
      error = this.httpErrors.internalServerError();
      return new HttpResponse(error.statusCode, {
        message: "Internal server error",
      });
    }
  }
}