import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IPromotionalVideoRepository } from "@/app/repositories/IPromotionalVideoRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { IGetPromotionalVideosUseCase } from "../IGetPromotionalVideosUseCase";
import { GetPromotionalVideosResponseDTO } from "@/domain/dtos/admin/promotionalVideo/GetPromotionalVideosResponseDTO";
import { GetPromotionalVideosErrorType } from "@/domain/enums/Admin/PromotionalVideo/GetPromotionalVideosErrorType";

@injectable()
export class GetPromotionalVideosUseCase implements IGetPromotionalVideosUseCase {
  constructor(
    @inject(TOKENS.PromotionalVideoRepository)
    private readonly promotionalVideoRepository: IPromotionalVideoRepository
  ) {}

  async execute(): Promise<ResponseDTO & { data: GetPromotionalVideosResponseDTO | { error: string } }> {
    try {
      const videos = await this.promotionalVideoRepository.findActiveVideos();

      const response: GetPromotionalVideosResponseDTO = {
        videos,
      };

      logger.info(`Fetched ${videos.length} active promotional videos`);
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error("Error fetching promotional videos:", {
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        data: { error: GetPromotionalVideosErrorType.InternalError },
      };
    }
  }
}