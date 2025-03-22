import { createTopicHandlers } from "@/app/event-handlers";
import { logger } from "@/infra/logger";
import { Container, Inject } from "typedi";
import { TOKENS } from "@/app/tokens";
import { IPromotionalVideoRepository } from "@/app/repositories/IPromotionalVideoRepository";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { ILocalEventEmitter } from "@/app/providers/ILocalEventEmitter";
import { KafkaEventConsumer } from "../providers/KafkaEventConsumer";
import { EventService } from "@/app/services/EventService";

export class KafkaConsumerService {
	
	constructor(
		@Inject(TOKENS.KafkaEventConsumer) private consumer: KafkaEventConsumer,
		@Inject(TOKENS.UserRepository) private usersRepository: IUsersRepository,
		@Inject(TOKENS.PromotionalVideoRepository)
		private promotionalVideoRepository: IPromotionalVideoRepository,
		@Inject(TOKENS.EventService) private eventService: EventService,
		@Inject(TOKENS.LocalEventEmitter) private eventEmitter: ILocalEventEmitter,
	) {
		
	}

	async start() {
		const topicHandlers = createTopicHandlers(
			this.usersRepository,
			this.promotionalVideoRepository,
			this.eventService,
			this.eventEmitter
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
