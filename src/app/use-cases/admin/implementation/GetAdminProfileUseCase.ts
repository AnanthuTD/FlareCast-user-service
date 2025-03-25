import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IAdminRepository } from "@/app/repositories/IAdminRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { IUseCase } from "@/app/use-cases/IUseCase";
import { GetAdminProfileDTO } from "@/domain/dtos/admin/GetAdminProfileDTO";
import { GetAdminProfileResponseDTO } from "@/domain/dtos/admin/GetAdminProfileResponseDTO";
import { GetAdminProfileErrorType } from "@/domain/enums/Admin/GetAdminProfileErrorType";
import { logger } from "@/infra/logger";

@injectable()
export class GetAdminProfileUseCase implements IUseCase<GetAdminProfileDTO, GetAdminProfileResponseDTO> {
  constructor(
    @inject(TOKENS.AdminRepository)
    private readonly adminRepository: IAdminRepository
  ) {}

  async execute(
    dto: GetAdminProfileDTO
  ): Promise<ResponseDTO & { data: GetAdminProfileResponseDTO | { error: string } }> {
    try {
      // Validate user ID
      if (!dto.userId) {
        logger.debug("User ID is required");
        return {
          success: false,
          data: { error: GetAdminProfileErrorType.MissingUserId },
        };
      }

      // Fetch the admin
      const admin = await this.adminRepository.findById(dto.userId);
      if (!admin) {
        logger.debug(`Admin ${dto.userId} not found`);
        return {
          success: false,
          data: { error: GetAdminProfileErrorType.AdminNotFound },
        };
      }

      // Prepare the response
      const response: GetAdminProfileResponseDTO = {
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: "admin",
        },
      };

      logger.info(`Admin profile for user ${dto.userId} fetched successfully`);
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error(`Error fetching admin profile for user ${dto.userId}:`, {
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        data: { error: GetAdminProfileErrorType.InternalError },
      };
    }
  }
}