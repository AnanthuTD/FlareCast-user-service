import { TOPICS } from "../config/topics";
import { logger } from "../logger/logger";
import { createTopic } from "./admin";
import { consumeMessages } from "./consumer";
import { handleVerifiedUserEvent } from "./handlers/verifiedUserEvent.handler";

// Create topics and start consuming messages
createTopic([TOPICS.USER_CREATED_EVENT, TOPICS.USER_VERIFIED_EVENT]).then(() => {
	logger.info("✅ Topic created successfully");

	const topicHandlers = {
		// received from email service after email is verified
		// [TOPICS.USER_VERIFIED_EVENT]: handleVerifiedUserEvent,
	};

	// Start consuming messages
	consumeMessages(topicHandlers).catch((error) => {
		logger.error("Failed to start consumer:", error);
	});
});
