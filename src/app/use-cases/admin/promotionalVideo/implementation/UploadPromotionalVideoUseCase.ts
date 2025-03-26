import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IPromotionalVideoRepository } from "@/app/repositories/IPromotionalVideoRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { IUploadPromotionalVideoUseCase } from "../IUploadPromotionalVideoUseCase";
import { UploadPromotionalVideoResponseDTO } from "@/domain/dtos/admin/promotionalVideo/UploadPromotionalVideoResponseDTO";
import { UploadPromotionalVideoDTO } from "@/domain/dtos/admin/promotionalVideo/UploadPromotionalVideoDTO";
import { UploadPromotionalVideoErrorType } from "@/domain/enums/Admin/PromotionalVideo/UploadPromotionalVideoErrorType";
import { IEventService } from "@/app/services/IEventService";

@injectable()
export class UploadPromotionalVideoUseCase implements IUploadPromotionalVideoUseCase {
  constructor(
    @inject(TOKENS.PromotionalVideoRepository)
    private readonly promotionalVideoRepository: IPromotionalVideoRepository,
    @inject(TOKENS.EventService)
    private readonly eventService: IEventService
  ) {}

  async execute(
    dto: UploadPromotionalVideoDTO
  ): Promise<ResponseDTO & { data: UploadPromotionalVideoResponseDTO | { error: string } }> {
    try {
      // Validate required fields
      if (!dto.videoId || !dto.s3Key) {
        logger.debug("videoId and s3Key are required");
        return {
          success: false,
          data: { error: UploadPromotionalVideoErrorType.MissingRequiredFields },
        };
      }

      // Validate category
      const validCategories = ["PROMOTIONAL", "NEW_FEATURE"];
      if (!dto.category || !validCategories.includes(dto.category.toUpperCase())) {
        logger.debug(`Invalid category: ${dto.category}`);
        return {
          success: false,
          data: { error: UploadPromotionalVideoErrorType.InvalidCategory },
        };
      }

      // Validate priority
      if (isNaN(dto.priority)) {
        logger.debug(`Invalid priority: ${dto.priority}`);
        return {
          success: false,
          data: { error: UploadPromotionalVideoErrorType.InvalidPriority },
        };
      }

      console.log(dto)

      // Trigger video processing via Kafka
      await this.eventService.sendVideoUploadEvent({
        s3Key: dto.s3Key,
        videoId: dto.videoId,
        aiFeature: !(dto.title || dto.description),
      });

      // Create promotional video entry
      const promoVideo = await this.promotionalVideoRepository.create({
        category: dto.category.toUpperCase() as "PROMOTIONAL" | "NEW_FEATURE",
        hidden: dto.hidden,
        videoId: dto.videoId,
        priority: dto.priority,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        title: dto.title || null,
        description: dto.description || null,
        createdBy: dto.createdBy,
      });

      const response: UploadPromotionalVideoResponseDTO = {
        message: "Promotional video metadata saved",
        data: promoVideo,
      };

      logger.info(`Promotional video created (videoId: ${dto.videoId})`);
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error(`Error creating promotional video (videoId: ${dto.videoId}):`, {
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        data: { error: UploadPromotionalVideoErrorType.InternalError },
      };
    }
  }
}