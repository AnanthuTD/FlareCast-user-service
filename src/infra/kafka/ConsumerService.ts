import { createTopicHandlers } from "@/app/event-handlers";
import { logger } from "@/infra/logger";
import { IPromotionalVideoRepository } from "@/app/repositories/IPromotionalVideoRepository";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { ILocalEventEmitter } from "@/app/providers/ILocalEventEmitter";
import { KafkaEventConsumer } from "../providers/KafkaEventConsumer";
import { inject, injectable } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { IEventService } from "@/app/services/IEventService";

@injectable()
export class KafkaConsumerService {
	constructor(
		@inject(TOKENS.KafkaEventConsumer) private consumer: KafkaEventConsumer,
		@inject(TOKENS.UserRepository) private usersRepository: IUsersRepository,
		@inject(TOKENS.PromotionalVideoRepository)
		private promotionalVideoRepository: IPromotionalVideoRepository,
		@inject(TOKENS.EventService) private eventService: IEventService,
		@inject(TOKENS.LocalEventEmitter) private eventEmitter: ILocalEventEmitter,
		@inject(TOKENS.UserSubscriptionRepository)
		private userSubscriptionRepository: IUserSubscriptionRepository
	) {}

	async start() {
		const topicHandlers = createTopicHandlers(
			this.usersRepository,
			this.promotionalVideoRepository,
			this.eventService,
			this.eventEmitter,
			this.userSubscriptionRepository
		);
		const topics = Object.keys(topicHandlers) as string[];

		try {
			await this.consumer.subscribe(
				topics,
				async (topic: string, data: any) => {
					const handler = topicHandlers[topic];
					if (handler) {
						await handler(topic, data);
					} else {
						logger.warn(`No handler defined for topic: ${topic}`);
					}
				}
			);

			this.setupSignalHandlers();
		} catch (error) {
			logger.error("Failed to start consumer:", error);
			await this.consumer.disconnect();
			process.exit(1);
		}
	}

	private setupSignalHandlers() {
		process.on("SIGTERM", async () => {
			logger.info("Received SIGTERM, shutting down consumer...");
			await this.consumer.disconnect();
			process.exit(0);
		});

		process.on("SIGINT", async () => {
			logger.info("Received SIGINT, shutting down consumer...");
			await this.consumer.disconnect();
			process.exit(0);
		});
	}

	async stop() {
		logger.info("Stopping consumer...");
		await this.consumer.disconnect();
	}
}
