import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IPromotionalVideoRepository } from "@/app/repositories/IPromotionalVideoRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { IUpdatePromotionalVideoUseCase } from "../IUpdatePromotionalVideoUseCase";
import { UpdatePromotionalVideoDTO } from "@/domain/dtos/admin/promotionalVideo/UpdatePromotionalVideoDTO";
import { UpdatePromotionalVideoResponseDTO } from "@/domain/dtos/admin/promotionalVideo/UpdatePromotionalVideoResponseDTO";
import { UpdatePromotionalVideoErrorType } from "@/domain/enums/Admin/PromotionalVideo/UpdatePromotionalVideoErrorType";

@injectable()
export class UpdatePromotionalVideoUseCase implements IUpdatePromotionalVideoUseCase {
  constructor(
    @inject(TOKENS.PromotionalVideoRepository)
    private readonly promotionalVideoRepository: IPromotionalVideoRepository
  ) {}

  async execute(
    dto: UpdatePromotionalVideoDTO
  ): Promise<ResponseDTO & { data: UpdatePromotionalVideoResponseDTO | { error: string } }> {
    try {
      const video = await this.promotionalVideoRepository.findById(dto.id);
      if (!video) {
        logger.debug(`Promotional video ${dto.id} not found`);
        return {
          success: false,
          data: { error: UpdatePromotionalVideoErrorType.VideoNotFound },
        };
      }

      const updatedVideo = await this.promotionalVideoRepository.update(dto);

      const response: UpdatePromotionalVideoResponseDTO = {
        message: "Promotional video updated",
        data: updatedVideo,
      };

      logger.info(`Promotional video ${dto.id} updated`);
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error(`Error updating promotional video ${dto.id}:`, {
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        data: { error: UpdatePromotionalVideoErrorType.InternalError },
      };
    }
  }
}