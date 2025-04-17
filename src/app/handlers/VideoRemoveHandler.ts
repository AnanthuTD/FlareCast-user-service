import { logger } from "@/infra/logger";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { VideoRemovedEvent } from "@/domain/events/VideoRemovedEvent";
import { Inject } from "typedi";
import { IEventHandler } from "../interfaces/IEventHandler";
import { TOKENS } from "../tokens";
import { inject, injectable } from "inversify";

@injectable()
export class VideoRemoveHandler implements IEventHandler {
	constructor(
		@inject(TOKENS.UserRepository)
		private readonly usersRepository: IUsersRepository
	) {}

	async handle(topic: string, data: VideoRemovedEvent): Promise<void> {
		try {
			logger.info(
				`⌛ Handling video removed event: ${JSON.stringify(data, null, 2)}`
			);

			const newCount = await this.usersRepository.decrementVideoCount(
				data.userId
			);
			logger.info(
				`✅ Video count decremented for user ${data.userId}. New count: ${newCount}`
			);
		} catch (error) {
			logger.error(
				`🔴 Failed to handle video removed event for video ${data.videoId}:`,
				error
			);
			throw error;
		}
	}
}
