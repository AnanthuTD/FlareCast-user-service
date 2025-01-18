import { Kafka } from "kafkajs";
import env from "../env";

const kafka = new Kafka({
	clientId: "user-service",
	brokers: [env.KAFKA_BROKER], // Add your broker addresses here
	// authenticationTimeout: 10000,
	// reauthenticationThreshold: 10000,
	// ssl: true,
/* 	sasl: {
		mechanism: "plain", // scram-sha-256 or scram-sha-512
		username: "user1",
		password: "iyqiceAe4i",
	}, */
});

const producer = kafka.producer();

export const notifyCollaborationService = async (
	userId: string,
	firstName: string
) => {
	await producer.connect();
	await producer.send({
		topic: "user-events",
		messages: [
			{ key: "user-created", value: JSON.stringify({ userId, firstName }) },
		],
	});
	await producer.disconnect();
};
