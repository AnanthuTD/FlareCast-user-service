import { VerifiedUserHandler } from "@/app/handlers/VerifiedUserHandler";
import { VideoUploadHandler } from "@/app/handlers/VideoUploadHandler";
import { VideoRemoveHandler } from "@/app/handlers/VideoRemoveHandler";
import { TitleAndSummaryHandler } from "@/app/handlers/TitleAndSummaryHandler";
import { TOPICS } from "@/infra/kafka/topics";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { IPromotionalVideoRepository } from "@/app/repositories/IPromotionalVideoRepository";
import { IEventService } from "./services/IEventService";
import { ILocalEventEmitter } from "./providers/ILocalEventEmitter";
import { IUserSubscriptionRepository } from "./repositories/IUserSubscriptionRepository";

export function createTopicHandlers(
	usersRepository: IUsersRepository,
	promotionalVideoRepository: IPromotionalVideoRepository,
	eventService: IEventService,
	eventEmitter: ILocalEventEmitter,
	userSubscriptionRepository: IUserSubscriptionRepository
): Record<string, (topic: string, data: any) => Promise<void>> {
	const verifiedUserHandler = new VerifiedUserHandler(
		usersRepository,
		userSubscriptionRepository,
		eventService,
		eventEmitter
	);
	const videoUploadHandler = new VideoUploadHandler(usersRepository);
	const videoRemoveHandler = new VideoRemoveHandler(usersRepository);
	const titleAndSummaryHandler = new TitleAndSummaryHandler(
		promotionalVideoRepository
	);

	return {
		[TOPICS.USER_VERIFIED_EVENT]: (topic: string, data: any) =>
			verifiedUserHandler.handle(topic, data),
		[TOPICS.VIDEO_UPLOAD_EVENT]: (topic: string, data: any) =>
			videoUploadHandler.handle(topic, data),
		[TOPICS.VIDEO_REMOVED_EVENT]: (topic: string, data: any) =>
			videoRemoveHandler.handle(topic, data),
		[TOPICS.VIDEO_SUMMARY_TITLE_EVENT]: (topic: string, data: any) =>
			titleAndSummaryHandler.handle(topic, data),
	};
}
