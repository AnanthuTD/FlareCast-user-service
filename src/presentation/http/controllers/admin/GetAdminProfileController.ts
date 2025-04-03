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
import { IUseCase } from "@/app/use-cases/IUseCase";
import { GetAdminProfileDTO } from "@/domain/dtos/admin/GetAdminProfileDTO";
import { GetAdminProfileResponseDTO } from "@/domain/dtos/admin/GetAdminProfileResponseDTO";
import { GetAdminProfileErrorType } from "@/domain/enums/Admin/GetAdminProfileErrorType";

/**
 * Controller for fetching the admin profile.
 */
@injectable()
export class GetAdminProfileController implements IController {
  constructor(
    @inject(TOKENS.GetAdminProfileUseCase)
    private readonly getAdminProfileUseCase: IUseCase<GetAdminProfileDTO, GetAdminProfileResponseDTO>,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & { data: GetAdminProfileResponseDTO | { error: string } };

    try {
      console.log(httpRequest.user)
      // Create DTO and call the use case
      const dto: GetAdminProfileDTO = { userId: httpRequest.user.id };
      response = await this.getAdminProfileUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case GetAdminProfileErrorType.MissingUserId:
            error = this.httpErrors.error_401();
            return new HttpResponse(error.statusCode, { message: "Unauthorized" });
          case GetAdminProfileErrorType.NotAdmin:
            error = this.httpErrors.error_401();
            return new HttpResponse(error.statusCode, { message: "Admin access required" });
          case GetAdminProfileErrorType.AdminNotFound:
            error = this.httpErrors.error_401();
            return new HttpResponse(error.statusCode, { message: "Admin not found" });
          case GetAdminProfileErrorType.InternalError:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, { message: "Internal server error" });
          default:
            error = this.httpErrors.error_500();
            return new HttpResponse(error.statusCode, { message: "Internal server error" });
        }
      }

      // Return the response
      const success = this.httpSuccess.success_200(response.data);
      return new HttpResponse(success.statusCode, success.body);
    } catch (err: any) {
      logger.error(`Error in GetAdminProfileController for user ${httpRequest.user?.id}:`, {
        message: err.message,
        stack: err.stack,
      });
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, { message: "Internal server error" });
    }
  }
}