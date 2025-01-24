import z from "zod";
import { logger } from "../logger/logger";
import kafka from "./kafka";
import { TOPICS } from "../config/topics";
import { markAsVerified } from "../repositories/userRepository";
import { sendUserVerifiedEvent } from "./producer";

const consumer = kafka.consumer({
	groupId: "user-service",
});

interface UserCreateMessage {
	userId: string;
	email: string;
}

export async function consumeMessages(topics: TOPICS[]) {
	logger.info("⌛ Consuming messages from topic(s):", topics);

	try {
		await consumer.connect();
		await consumer.subscribe({ topics });

		await consumer.run({
			eachMessage: async ({ topic, partition, message }) => {
				logger.info({
					topic,
					partition,
					message: message.value?.toString(),
				});

				logger.debug(JSON.stringify(message, null, 2));

				let { value } = message;

				value = JSON.parse(value.toString());

				// send verification email
				if (value) {
					if (topic === TOPICS.USER_VERIFIED_EVENT) {
						logger.info("User verified: ", value);
						handleVerifiedUserEvent(value);
					}
				}
			},
		});
	} catch (error) {
		logger.error("🔴 Error consuming Kafka message", {
			message: error.message,
			stack: error.stack,
			name: error.name,
			code: error.code || "UNKNOWN_ERROR",
		});
	}
}

async function handleVerifiedUserEvent({ userId, email }: UserCreateMessage) {
	try {
		const user = await markAsVerified(userId, email);
		if (user && user.isVerified) {
			sendUserVerifiedEvent(userId, user.firstName);
		}
	} catch (error) {
		logger.error("Failed to send message!", error);
	}
}
