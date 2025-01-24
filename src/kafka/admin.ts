import { logger } from "../logger/logger";
import kafka from "./kafka";

const admin = kafka.admin();

export async function createTopic() {
  const topicName = "user-created-event";
  logger.info("⏳ Checking if topic exists: " + topicName);

  try {
    await admin.connect();
    
    // Fetch metadata for all topics
    const metadata = await admin.fetchTopicMetadata();
    const existingTopics = metadata.topics.map((topic) => topic.name);
    
    // Check if the topic exists
    if (existingTopics.includes(topicName)) {
      logger.info(`✅ Topic "${topicName}" already exists.`);
    } else {
      // If the topic doesn't exist, create it
      logger.info(`⏳ Topic "${topicName}" does not exist. Creating it...`);
      await admin.createTopics({
        topics: [{ topic: topicName, numPartitions: 1, replicationFactor: 1 }],
      });
      logger.info(`✅ Topic "${topicName}" created.`);
    }
  } catch (error) {
    logger.error(`🔴 Error processing topic "${topicName}":`, error);
  } finally {
    await admin.disconnect();
  }
}
