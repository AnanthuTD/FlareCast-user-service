import { Kafka, type Producer } from "kafkajs";
import { IEventPublisher } from "@/app/interfaces/IEventPublisher";
import { logger } from "@/infra/logger";
import env from "@/infra/env";
import { injectable } from "inversify";

@injectable()
export class KafkaEventPublisher implements IEventPublisher {
  private producer: Producer;
  private clientId = "user-service";

  constructor() {
    const kafka = new Kafka({
      clientId: this.clientId,
      brokers: [env.KAFKA_BROKER],
    });
    this.producer = kafka.producer();
  }

  async publish(eventName: string, data: any): Promise<void> {
    try {
      await this.producer.connect();
      await this.producer.send({
        topic: eventName,
        messages: [{ value: JSON.stringify(data) }],
      });
      logger.debug(`✔️ Published event to topic ${eventName}: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      logger.error(`🔴 Failed to publish event to ${eventName}:`, error);
      throw error;
    } finally {
      await this.producer.disconnect();
    }
  }
}