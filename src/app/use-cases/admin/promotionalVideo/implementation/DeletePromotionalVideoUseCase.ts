import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IPromotionalVideoRepository } from "@/app/repositories/IPromotionalVideoRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { IDeletePromotionalVideoUseCase } from "../IDeletePromotionalVideoUseCase";
import { DeletePromotionalVideoDTO } from "@/domain/dtos/admin/promotionalVideo/DeletePromotionalVideoDTO";
import { DeletePromotionalVideoResponseDTO } from "@/domain/dtos/admin/promotionalVideo/DeletePromotionalVideoResponseDTO";
import { DeletePromotionalVideoErrorType } from "@/domain/enums/Admin/PromotionalVideo/DeletePromotionalVideoErrorType";
import axios from "axios";
import env from "@/infra/env";

@injectable()
export class DeletePromotionalVideoUseCase
	implements IDeletePromotionalVideoUseCase
{
	constructor(
		@inject(TOKENS.PromotionalVideoRepository)
		private readonly promotionalVideoRepository: IPromotionalVideoRepository
	) {}

	async execute(dto: DeletePromotionalVideoDTO): Promise<
		ResponseDTO & {
			data: DeletePromotionalVideoResponseDTO | { error: string };
		}
	> {
		try {
			const video = await this.promotionalVideoRepository.findById(dto.id);
			if (!video) {
				logger.debug(`Promotional video ${dto.id} not found`);
				return {
					success: false,
					data: { error: DeletePromotionalVideoErrorType.VideoNotFound },
				};
			}

			await this.promotionalVideoRepository.delete(dto.id);

			axios
				.delete(`${env.VIDEO_SERVICE}/api/interservice/video/${video.videoId}`)
				.catch((e) =>
					console.error("Failed to remove video from video service!")
				);

			const response: DeletePromotionalVideoResponseDTO = {
				message: "Promotional video deleted",
			};

			logger.info(`Promotional video ${dto.id} deleted`);
			return {
				success: true,
				data: response,
			};
		} catch (err: any) {
			logger.error(`Error deleting promotional video ${dto.id}:`, {
				message: err.message,
				stack: err.stack,
			});
			return {
				success: false,
				data: { error: DeletePromotionalVideoErrorType.InternalError },
			};
		}
	}
}
