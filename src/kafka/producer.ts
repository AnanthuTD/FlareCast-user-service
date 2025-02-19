import { TOPICS } from "../config/topics";
import { logger } from "../logger/logger";
import kafka from "./kafka";

const producer = kafka.producer({});

export async function sendMessage(topic: string, message: string) {
	try {
		await producer.connect();

		await producer.send({
			topic,
			messages: [{ value: message }],
		});

		await producer.disconnect();
	} catch (error) {
		logger.error("🔴 Failed to send message to " + topic, error);
	}
}

export const sendUserVerifiedEvent = async ({
	userId,
	firstName,
	lastName,
	email,
	image,
}: {
	userId: string;
	firstName: string;
	lastName: string;
	email: string;
	image: string;
}) => {
	await sendMessage(
		TOPICS.USER_VERIFIED_EVENT,
		JSON.stringify({ userId, firstName, lastName, email, image })
	);
	logger.debug(
		"✔️ user-event sended to kafka: " +
			JSON.stringify({ userId, firstName, lastName, email, image }, null, 2)
	);
};

export const sendUserCreationEvent = async (userId: string, email: string) => {
	await sendMessage(
		TOPICS.USER_CREATED_EVENT,
		JSON.stringify({ userId, email })
	);
	logger.debug(
		`✔️ ${TOPICS.USER_CREATED_EVENT} sended to kafka: ` +
			JSON.stringify({ userId, email }, null, 2)
	);
	
};
