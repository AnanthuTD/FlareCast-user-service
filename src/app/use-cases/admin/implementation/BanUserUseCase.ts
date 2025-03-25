import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { logger } from "@/infra/logger";
import { Prisma } from "@prisma/client";
import { IBanUserUseCase } from "../IBanUserUseCase";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { BanUserDTO } from "@/domain/dtos/admin/BanUserDTO";
import { ResponseDTO } from "@/domain/dtos/Response";
import { BanUserResponseDTO } from "@/domain/dtos/admin/BanUserResponseDTO";
import { BanUserErrorType } from "@/domain/enums/Admin/BanUserErrorType";
import { Email } from "@/domain/valueObjects/email";

@injectable()
export class BanUserUseCase implements IBanUserUseCase {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly userRepository: IUsersRepository
  ) {}

  async execute(
    dto: BanUserDTO
  ): Promise<ResponseDTO & { data: BanUserResponseDTO | { error: string } }> {
    try {
      // Validate input
      if (!dto.userId) {
        logger.debug("User ID is required");
        return {
          success: false,
          data: { error: BanUserErrorType.InvalidInput },
        };
      }

      if (typeof dto.isBanned !== "boolean") {
        logger.debug("isBanned must be a boolean");
        return {
          success: false,
          data: { error: BanUserErrorType.InvalidInput },
        };
      }

      // Update user ban status
      const updatedUser = await this.userRepository.updateUserBanStatus(dto.userId, dto.isBanned);
      if (!updatedUser) {
        logger.debug(`User ${dto.userId} not found`);
        return {
          success: false,
          data: { error: BanUserErrorType.UserNotFound },
        };
      }

      // Prepare the response
      const response: BanUserResponseDTO = {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName ?? "",
          isBanned: updatedUser.isBanned,
          createdAt: updatedUser.createdAt,
        },
      };

      logger.info(`User ${dto.userId} ban status updated to ${dto.isBanned}`);
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error(`Error updating ban status for user ${dto.userId}:`, {
        message: err.message,
        stack: err.stack,
      });

      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        return {
          success: false,
          data: { error: BanUserErrorType.UserNotFound },
        };
      }

      return {
        success: false,
        data: { error: BanUserErrorType.InternalError },
      };
    }
  }
}