import { Kafka } from "kafkajs";
import { logger } from "@/infra/logger";
import env from "@/infra/env";
import { TOPICS } from "@/infra/kafka/topics";

export async function setupTopics() {
  const kafka = new Kafka({
    clientId: "user-service",
    brokers: [env.KAFKA_BROKER],
  });
  const admin = kafka.admin();

  try {
    await admin.connect();

    const metadata = await admin.fetchTopicMetadata();
    const existingTopics = new Set(metadata.topics.map((topic) => topic.name));

    for (const topicName of Object.values(TOPICS)) {
      logger.info(`⏳ Checking if topic exists: ${topicName}`);

      if (existingTopics.has(topicName)) {
        logger.info(`✅ Topic "${topicName}" already exists.`);
      } else {
        logger.info(`⏳ Topic "${topicName}" does not exist. Creating it...`);
        try {
          await admin.createTopics({
            topics: [
              {
                topic: topicName,
                numPartitions: 1,
                replicationFactor: 1,
              },
            ],
          });
          logger.info(`✅ Topic "${topicName}" created.`);
        } catch (error) {
          logger.error(`🔴 Error creating topic "${topicName}":`, error);
        }
      }
    }
  } catch (error) {
    logger.error("🔴 Error processing topics:", error);
  } finally {
    await admin.disconnect();
  }
}

// Run the script
setupTopics().catch((error) => {
  logger.error("Failed to setup topics:", error);
  process.exit(1);
});