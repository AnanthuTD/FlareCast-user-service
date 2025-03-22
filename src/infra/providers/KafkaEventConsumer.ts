import { Kafka, Consumer } from "kafkajs";
import { IEventConsumer } from "@/app/interfaces/IEventConsumer";
import { logger } from "@/infra/logger";
import env from "@/infra/env";

interface KafkaConfig {
	clientId: string;
	brokers: string[];
}

export class KafkaEventConsumer implements IEventConsumer {
	private consumer: Consumer;
	private clientId = "user-service";

	constructor() {
		const kafkaConfig: KafkaConfig = {
			clientId: this.clientId,
			brokers: [env.KAFKA_BROKER],
		};
		const kafka = new Kafka(kafkaConfig);
		this.consumer = kafka.consumer({
			groupId: this.clientId,
			allowAutoTopicCreation: true,
		});
	}

	async subscribe(
		topics: string[],
		handler: (topic: string, data: any) => Promise<void>
	): Promise<void> {
		logger.info(`⌛ Subscribing to topics: ${topics.join(", ")}`);

		try {
			await this.consumer.connect();
			await this.consumer.subscribe({ topics });

			await this.consumer.run({
				eachMessage: async ({ topic, partition, message }) => {
					logger.info(
						`Received message on topic ${topic}, partition ${partition}: ${message.value?.toString()}`
					);

					const value = message.value;
					if (value) {
						try {
							const parsedData = JSON.parse(value.toString()) as object;
							await handler(topic, parsedData);
						} catch (parseError) {
							logger.error(
								`Failed to parse message on topic ${topic}: ${value?.toString()}`,
								parseError
							);
							throw new Error(
								`Failed to parse message on topic ${topic}: ${parseError?.message}`
							);
						}
					} else {
						logger.warn(
							`Received empty message on topic ${topic}, partition ${partition}`
						);
					}
				},
			});
		} catch (error) {
			logger.error(
				`Failed to subscribe to topics ${topics.join(", ")}:`,
				error
			);
			throw new Error(`Failed to subscribe to topics: ${error.message}`);
		}
	}

	async disconnect(): Promise<void> {
		try {
			await this.consumer.disconnect();
			logger.info("Kafka consumer disconnected successfully");
		} catch (error) {
			logger.error("Failed to disconnect Kafka consumer:", error);
			throw new Error(`Failed to disconnect Kafka consumer: ${error.message}`);
		}
	}
}
