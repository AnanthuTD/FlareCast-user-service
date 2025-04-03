import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { IGetPaginatedUsersUseCase } from "../IGetPaginatedUsersUseCase";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { GetPaginatedUsersDTO } from "@/domain/dtos/admin/GetPaginatedUsersDTO";
import { GetPaginatedUsersResponseDTO } from "@/domain/dtos/admin/GetPaginatedUsersResponseDTO";
import { GetPaginatedUsersErrorType } from "@/domain/enums/Admin/GetPaginatedUsersErrorType";

@injectable()
export class GetPaginatedUsersUseCase implements IGetPaginatedUsersUseCase {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly userRepository: IUsersRepository
  ) {}

  async execute(
    dto: GetPaginatedUsersDTO
  ): Promise<ResponseDTO & { data: GetPaginatedUsersResponseDTO | { error: string } }> {
    try {
      // Validate pagination parameters
      if (dto.page < 1 || dto.limit < 1) {
        logger.debug("Page and limit must be positive integers");
        return {
          success: false,
          data: { error: GetPaginatedUsersErrorType.InvalidPaginationParams },
        };
      }

      // Fetch paginated users
      const { users, total, totalPages, currentPage } = await this.userRepository.findPaginatedUsers({
        page: dto.page,
        limit: dto.limit,
        searchQuery: dto.searchQuery,
        includeBanned: dto.includeBanned,
      });

      // Prepare the response
      const response: GetPaginatedUsersResponseDTO = {
        users,
        pagination: {
          total,
          totalPages,
          currentPage,
          limit: dto.limit,
        },
      };

      logger.info(`Fetched paginated users (page: ${dto.page}, limit: ${dto.limit})`);
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error("Error fetching paginated users:", {
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        data: { error: GetPaginatedUsersErrorType.InternalError },
      };
    }
  }
}