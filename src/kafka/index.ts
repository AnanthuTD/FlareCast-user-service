import { logger } from "../logger/logger";
import { createTopic } from "./admin";
import { consumeMessages } from "./consumer";

createTopic().then(() => {
  logger.info("✅ Topic created successfully");
  consumeMessages()
});