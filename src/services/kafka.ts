import { Kafka } from "kafkajs";

const kafka = new Kafka({
	clientId: "user-service",
	brokers: ["localhost:9092"], // Add your broker addresses here
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
