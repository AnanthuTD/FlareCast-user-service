import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IPromotionalVideoRepository } from "@/app/repositories/IPromotionalVideoRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { IGetPromotionalVideoByIdUseCase } from "../IGetPromotionalVideoByIdUseCase";
import { GetPromotionalVideoByIdDTO } from "@/domain/dtos/admin/promotionalVideo/GetPromotionalVideoByIdDTO";
import { GetPromotionalVideoByIdResponseDTO } from "@/domain/dtos/admin/promotionalVideo/GetPromotionalVideoByIdResponseDTO";
import { GetPromotionalVideoByIdErrorType } from "@/domain/enums/Admin/PromotionalVideo/GetPromotionalVideoByIdErrorType";

@injectable()
export class GetPromotionalVideoByIdUseCase implements IGetPromotionalVideoByIdUseCase {
  constructor(
    @inject(TOKENS.PromotionalVideoRepository)
    private readonly promotionalVideoRepository: IPromotionalVideoRepository
  ) {}

  async execute(
    dto: GetPromotionalVideoByIdDTO
  ): Promise<ResponseDTO & { data: GetPromotionalVideoByIdResponseDTO | { error: string } }> {
    try {
      const video = await this.promotionalVideoRepository.findById(dto.id);
      if (!video) {
        logger.debug(`Promotional video ${dto.id} not found`);
        return {
          success: false,
          data: { error: GetPromotionalVideoByIdErrorType.VideoNotFound },
        };
      }

      const response: GetPromotionalVideoByIdResponseDTO = {
        video,
      };

      logger.info(`Fetched promotional video ${dto.id}`);
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error(`Error fetching promotional video ${dto.id}:`, {
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        data: { error: GetPromotionalVideoByIdErrorType.InternalError },
      };
    }
  }
}