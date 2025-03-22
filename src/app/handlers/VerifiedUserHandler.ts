import { logger } from "@/infra/logger";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { EventService } from "@/app/services/EventService";
import { UserVerifiedEvent } from "@/domain/events/UserVerifiedEvent";
import { Inject } from "typedi";
import { ILocalEventEmitter } from "../providers/ILocalEventEmitter";
import EventName from "../event-names";
import { IEventHandler } from "../interfaces/IEventHandler";
import { TOKENS } from "../tokens";

export class VerifiedUserHandler implements IEventHandler{
	constructor(
		@Inject(TOKENS.UserRepository) private readonly usersRepository: IUsersRepository,
		@Inject(TOKENS.EventService) private readonly eventService: EventService,
		@Inject(TOKENS.LocalEventEmitter) private readonly eventEmitter: ILocalEventEmitter
	) {}

	async handle(
		topic: string,
		data: { userId: string; email: string }
	): Promise<void> {
		try {
			logger.debug(
				`✔️ Received a verified user event: ${JSON.stringify(data.userId)}`
			);

			const user = await this.usersRepository.markAsVerified(
				data.userId,
				data.email
			);
			if (!user || !user.isVerified) {
				throw new Error(`User not found or not verified: ${data.userId}`);
			}

			const eventData: UserVerifiedEvent = {
				userId: data.userId,
				firstName: user.firstName,
				lastName: user.lastName ?? "",
				email: user.email.address,
				image: user.image ?? "",
			};

			await this.eventService.publishUserVerifiedEvent(eventData);
			this.eventEmitter.emit(EventName.NEW_USER_SIGNUP, eventData);
		} catch (error) {
			logger.error("Failed to handle verified user event:", error);
			throw error;
		}
	}
}
