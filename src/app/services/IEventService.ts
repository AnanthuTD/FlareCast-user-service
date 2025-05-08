import { UserVerifiedEvent } from "@/domain/events/UserVerifiedEvent";
import { UserCreatedEvent } from "@/domain/events/UserCreatedEvent";
import { VideoUploadEvent } from "@/domain/events/VideoUploadEvent";
import { VideoRemovedEvent } from "@/domain/events/VideoRemovedEvent";
import { VideoSummaryTitleEvent } from "@/domain/events/VideoSummaryTitleEvent";

export interface IEventService {
	publishUserVerifiedEvent(eventData: UserVerifiedEvent): Promise<void>;
	publishUserCreatedEvent(eventData: UserCreatedEvent): Promise<void>;
	publishVideoUploadEvent(eventData: VideoUploadEvent): Promise<void>;
	publishVideoRemovedEvent(eventData: VideoRemovedEvent): Promise<void>;
	publishVideoSummaryTitleEvent(
		eventData: VideoSummaryTitleEvent
	): Promise<void>;
	sendVideoUploadEvent(data: {
		s3Key: string;
		videoId: string;
		userId?: string;
		aiFeature?: boolean;
	}): Promise<void>;
	publishSubscriptionUpdateEvent(data: { userId: string }): Promise<void>;
}
