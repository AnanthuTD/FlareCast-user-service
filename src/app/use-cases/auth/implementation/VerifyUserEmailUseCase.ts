import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IEmailService } from "@/app/services/IEmailService";
import { ResponseDTO } from "@/domain/dtos/Response";
import { UserLoginErrorType } from "@/domain/enums/Authenticate/UserLoginErrorType";
import { IVerifyUserEmailUseCase } from "../IVerifyUserEmailUseCase";
import { logger } from "@/infra/logger";

@injectable()
export class VerifyUserEmailUseCase implements IVerifyUserEmailUseCase {
  constructor(
    @inject(TOKENS.EmailService)
    private readonly emailService: IEmailService
  ) {}

  async execute(userId: string): Promise<ResponseDTO> {
    try {
      const isVerified = await this.emailService.isUserVerified(userId);
      if (!isVerified) {
        logger.debug("User is not verified:", userId);
        return {
          success: false,
          data: { error: UserLoginErrorType.UserNotVerified },
        };
      }

      return {
        success: true,
        data: { message: "User is verified" },
      };
    } catch (err: any) {
      logger.debug("Failed to check if user is verified:", err.message);
      return {
        success: false,
        data: { error: UserLoginErrorType.EmailServiceUnavailable },
      };
    }
  }
}