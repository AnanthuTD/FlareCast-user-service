import { logger } from "@/infra/logger";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { VideoUploadEvent } from "@/domain/events/VideoUploadEvent";
import { TOKENS } from "../tokens";
import { inject, injectable } from "inversify";

@injectable()
export class VideoUploadHandler {
	constructor(
		@inject(TOKENS.UserRepository)
		private readonly usersRepository: IUsersRepository
	) {}

	async handle(topic: string, data: VideoUploadEvent): Promise<void> {
		try {
			logger.info(
				`⌛ Handling video upload event: ${JSON.stringify(data, null, 2)}`
			);

			if (data.userId) {
				const newCount = await this.usersRepository.incrementVideoCount(
					data.userId
				);
				logger.info(
					`✅ Video count incremented for user ${data.userId}. New count: ${newCount}`
				);
			}
		} catch (error) {
			logger.error(
				`🔴 Failed to handle video upload event for video ${data.videoId}:`,
				error
			);
			// throw error;
		}
	}
}
