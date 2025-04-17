import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { IGetSignedUrlUseCase } from "../IGetSignedUrlUseCase";
import { GetSignedUrlDTO } from "@/domain/dtos/admin/promotionalVideo/GetSignedUrlDTO";
import { GetSignedUrlResponseDTO } from "@/domain/dtos/admin/promotionalVideo/GetSignedUrlResponseDTO";
import { GetSignedUrlErrorType } from "@/domain/enums/Admin/PromotionalVideo/GetSignedUrlErrorType";
import { IVideoServiceClient } from "@/app/services/IVideoServiceClient";

@injectable()
export class GetSignedUrlUseCase implements IGetSignedUrlUseCase {
  constructor(
    @inject(TOKENS.VideoServiceClient)
    private readonly videoServiceClient: IVideoServiceClient
  ) {}

  async execute(
    dto: GetSignedUrlDTO
  ): Promise<ResponseDTO & { data: GetSignedUrlResponseDTO | { error: string } }> {
    try {
      // Validate fileName
      if (!dto.fileName) {
        logger.debug("fileName is required");
        return {
          success: false,
          data: { error: GetSignedUrlErrorType.MissingFileName },
        };
      }

      const videoExtension = dto.fileName.split(".").pop()?.toLowerCase();
      if (!videoExtension || !["mp4", "webm"].includes(videoExtension)) {
        logger.debug(`Invalid video extension: ${videoExtension}`);
        return {
          success: false,
          data: { error: GetSignedUrlErrorType.InvalidVideoExtension },
        };
      }

      // Call video service to get signed URL
      const result = await this.videoServiceClient.getSignedUrl({
        title: dto.title,
        description: dto.description,
        type: "PROMOTIONAL",
        videoExtension,
      });

      if (!result.videoId || !result.signedUrl) {
        logger.error("Missing videoId or signedUrl from video service");
        return {
          success: false,
          data: { error: GetSignedUrlErrorType.VideoServiceError },
        };
      }

      const response: GetSignedUrlResponseDTO = {
        message: result.message,
        signedUrl: result.signedUrl,
        videoId: result.videoId,
      };

      logger.info(`Signed URL generated for video (videoId: ${result.videoId})`);
      return {
        success: true,
        data: response,
      };
    } catch (err: any) {
      logger.error("Error fetching signed URL:", {
        message: err.message,
        stack: err.stack,
      });
      return {
        success: false,
        data: { error: GetSignedUrlErrorType.InternalError },
      };
    }
  }
}