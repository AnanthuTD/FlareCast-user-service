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
import { VerifyPaymentDTO } from "@/domain/dtos/subscription/VerifyPaymentDTO";
import { VerifyPaymentResponseDTO } from "@/domain/dtos/subscription/VerifyPaymentResponseDTO";
import { VerifyPaymentErrorType } from "@/domain/enums/Subscription/VerifyPaymentErrorType";

/**
 * Controller for verifying Razorpay payments.
 */
@injectable()
export class VerifyPaymentController implements IController {
  constructor(
    @inject(TOKENS.VerifyPaymentUseCase)
    private readonly verifyPaymentUseCase: IUseCase<VerifyPaymentDTO, VerifyPaymentResponseDTO>,
    @inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
    @inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess
  ) {}

  async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
    let error;
    let response: ResponseDTO & { data: VerifyPaymentResponseDTO | { error: string } };

    try {
      // Extract payment details from the request body
      const { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } = httpRequest.body as {
        razorpayPaymentId?: string;
        razorpaySubscriptionId?: string;
        razorpaySignature?: string;
      };

      // Create DTO and call the use case
      const dto: VerifyPaymentDTO = {
        razorpayPaymentId: razorpayPaymentId || "",
        razorpaySubscriptionId: razorpaySubscriptionId || "",
        razorpaySignature: razorpaySignature || "",
      };
      response = await this.verifyPaymentUseCase.execute(dto);

      if (!response.success) {
        const errorType = response.data.error as string;
        switch (errorType) {
          case VerifyPaymentErrorType.MissingRequiredFields:
            error = this.httpErrors.error_400();
            return new HttpResponse(error.statusCode, {
              message: "Missing required fields",
            });
          case VerifyPaymentErrorType.InvalidPayment:
            error = this.httpErrors.error_400();
            return new HttpResponse(error.statusCode, {
              message: "Invalid payment",
            });
          case VerifyPaymentErrorType.InternalError:
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
      logger.error("Error verifying payment:", err);
      error = this.httpErrors.error_500();
      return new HttpResponse(error.statusCode, {
        message: "Internal server error",
      });
    }
  }
}