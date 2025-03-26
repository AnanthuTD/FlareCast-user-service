import { IEventPublisher } from "@/app/interfaces/IEventPublisher";
import { UserVerifiedEvent } from "@/domain/events/UserVerifiedEvent";
import { UserCreatedEvent } from "@/domain/events/UserCreatedEvent";
import { VideoUploadEvent } from "@/domain/events/VideoUploadEvent";
import { VideoRemovedEvent } from "@/domain/events/VideoRemovedEvent";
import { VideoSummaryTitleEvent } from "@/domain/events/VideoSummaryTitleEvent";
import { TOPICS } from "@/infra/kafka/topics";
import { logger } from "@/infra/logger";
import { inject, injectable } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IEventService } from "../IEventService";

@injectable()
export class EventService implements IEventService {
  constructor(
    @inject(TOKENS.EventPublisher)
    private readonly eventPublisher: IEventPublisher
  ) {}

  async publishUserVerifiedEvent(eventData: UserVerifiedEvent): Promise<void> {
    try {
      await this.eventPublisher.publish(TOPICS.USER_VERIFIED_EVENT, eventData);
      logger.debug(
        `✔️ Published user.verified event: ${JSON.stringify(eventData, null, 2)}`
      );
    } catch (error: any) {
      logger.error(
        `Failed to publish user.verified event: ${JSON.stringify(eventData)}`,
        error
      );
      throw new Error(`Failed to publish user.verified event: ${error.message}`);
    }
  }

  async publishUserCreatedEvent(eventData: UserCreatedEvent): Promise<void> {
    try {
      await this.eventPublisher.publish(TOPICS.USER_CREATED_EVENT, eventData);
      logger.debug(
        `✔️ Published user.created event: ${JSON.stringify(eventData, null, 2)}`
      );
    } catch (error: any) {
      logger.error(
        `Failed to publish user.created event: ${JSON.stringify(eventData)}`,
        error
      );
      throw new Error(`Failed to publish user.created event: ${error.message}`);
    }
  }

  async publishVideoUploadEvent(eventData: VideoUploadEvent): Promise<void> {
    try {
      await this.eventPublisher.publish(TOPICS.VIDEO_UPLOAD_EVENT, eventData);
      logger.debug(
        `✔️ Published video.uploaded event: ${JSON.stringify(eventData, null, 2)}`
      );
    } catch (error: any) {
      logger.error(
        `Failed to publish video.uploaded event: ${JSON.stringify(eventData)}`,
        error
      );
      throw new Error(`Failed to publish video.uploaded event: ${error.message}`);
    }
  }

  async publishVideoRemovedEvent(eventData: VideoRemovedEvent): Promise<void> {
    try {
      await this.eventPublisher.publish(TOPICS.VIDEO_REMOVED_EVENT, eventData);
      logger.debug(
        `✔️ Published video.removed event: ${JSON.stringify(eventData, null, 2)}`
      );
    } catch (error: any) {
      logger.error(
        `Failed to publish video.removed event: ${JSON.stringify(eventData)}`,
        error
      );
      throw new Error(`Failed to publish video.removed event: ${error.message}`);
    }
  }

  async publishVideoSummaryTitleEvent(
    eventData: VideoSummaryTitleEvent
  ): Promise<void> {
    try {
      await this.eventPublisher.publish(TOPICS.VIDEO_SUMMARY_TITLE_EVENT, eventData);
      logger.debug(
        `✔️ Published video.summary-title event: ${JSON.stringify(eventData, null, 2)}`
      );
    } catch (error: any) {
      logger.error(
        `Failed to publish video.summary-title event: ${JSON.stringify(eventData)}`,
        error
      );
      throw new Error(`Failed to publish video.summary-title event: ${error.message}`);
    }
  }

  async sendVideoUploadEvent(data: {
    s3Key: string;
    videoId: string;
    userId?: string;
    aiFeature?: boolean;
  }): Promise<void> {
    try {
      logger.info("Preparing to send video upload event");

     /*  const eventData: VideoUploadEvent = {
        videoId: data.videoId,
        userId: data.userId ?? "",
        title: "", // Placeholder; title might be set later
        url: data.s3Key,
        createdAt: new Date().toISOString(),
      }; */

      // await this.publishVideoUploadEvent(eventData);
      await this.eventPublisher.publish(TOPICS.VIDEO_UPLOAD_EVENT, data);
      logger.info("✅ Video upload event sent successfully");
    } catch (error: any) {
      logger.error("Failed to send video upload event:", error);
      throw error;
    }
  }
}