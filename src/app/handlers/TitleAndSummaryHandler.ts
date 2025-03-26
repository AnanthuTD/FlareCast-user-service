import { logger } from "@/infra/logger";
import { IPromotionalVideoRepository } from "@/app/repositories/IPromotionalVideoRepository";
import { VideoSummaryTitleEvent } from "@/domain/events/VideoSummaryTitleEvent";
import { Inject } from "typedi";
import { TOKENS } from "../tokens";
import { IEventHandler } from "../interfaces/IEventHandler";
import { inject, injectable } from "inversify";

enum VideoStatus {
	SUCCESS = "success",
	FAILED = "failed",
	PROCESSING = "processing",
}

@injectable()
export class TitleAndSummaryHandler implements IEventHandler {
	constructor(
		@inject(TOKENS.PromotionalVideoRepository) private readonly promotionalVideoRepository: IPromotionalVideoRepository
	) {}

	async handle(
		topic: string,
		data: VideoSummaryTitleEvent & { status: VideoStatus }
	): Promise<void> {
		logger.info(
			`⌛ New title and summary event received, status: ${
				data.status === VideoStatus.SUCCESS
					? "🟢 success"
					: data.status === VideoStatus.FAILED
					? "🔴 failed"
					: "🟡 processing"
			}`,
			data
		);

		if (data.status !== VideoStatus.SUCCESS) {
			logger.info(
				`🟡 Skipping title and summary update for video: ${JSON.stringify({
					videoId: data.videoId,
				})}`
			);
			return;
		}

		try {
			logger.info(
				`⌛ Updating title and description for video: ${JSON.stringify(
					data,
					null,
					2
				)}`
			);

			await this.promotionalVideoRepository.updateTitleAndDescription(
				data.videoId,
				data.title,
				data.summary
			);

			logger.info("✅ Title and description updated successfully!");
		} catch (error) {
			logger.error(
				`🔴 Error updating title and description for video ${data.videoId}:`,
				error
			);
			throw error;
		}
	}
}
