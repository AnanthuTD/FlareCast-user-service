import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { CanSubscribeDTO } from "@/domain/dtos/subscription/CanSubscribeDTO";
import { CanSubscribeResponseDTO } from "@/domain/dtos/subscription/CanSubscribeResponseDTO";
import { CanSubscribeErrorType } from "@/domain/enums/Subscription/CanSubscribeErrorType";
import { ICanSubscribeUseCase } from "../ICanSubscribeUseCase";
import { logger } from "@/infra/logger";

@injectable()
export class CanSubscribeUseCase implements ICanSubscribeUseCase {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly usersRepository: IUsersRepository
  ) {}

  async execute(dto: CanSubscribeDTO): Promise<ResponseDTO> {
    try {
      // Validate user ID
      if (!dto.userId) {
        logger.debug("User ID is required");
        return {
          success: false,
          data: { error: CanSubscribeErrorType.MissingUserId },
        };
      }

      // Check if the user can subscribe
      const result = await this.usersRepository.canSubscribe(dto.userId);
      if (!result.canSubscribe) {
        logger.debug(`User ${dto.userId} cannot subscribe: ${result.message}`);
        return {
          success: false,
          data: {
            error: CanSubscribeErrorType.CannotSubscribe,
            message: result.message,
            canSubscribe: result.canSubscribe,
          },
        };
      }

      // Prepare the response
      const response: CanSubscribeResponseDTO = {
        message: "User can subscribe",
      };

      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error("Error checking subscription eligibility:", err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}