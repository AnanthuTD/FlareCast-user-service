import app from "./app";
import env from "@/infra/env";
import { logger } from "@/infra/logger";
import { createServer } from "node:http";
import { KafkaConsumerService } from "@/infra/kafka/ConsumerService";
import { initializeSocket } from "../websocket/socket";
import { connectRedis } from "@/infra/redis";
import { TOKENS } from "@/app/tokens";
import container from "@/infra/di-container";

const bootstrap = async () => {
	try {
		logger.info("Starting application...");

		// Start Kafka consumer
		const consumerService = container.get(
			TOKENS.KafkaConsumerService
		) as KafkaConsumerService;
		consumerService.start();

		// connect to redis
		await connectRedis();

		const server = createServer(app);
		initializeSocket(server);
		server.listen(env.PORT, () => {
			logger.info(`Server running at http://localhost:${env.PORT}`);
		});
	} catch (err) {
		logger.error(`Error starting the server: ${(err as Error).message}`);
	}
};

bootstrap().catch((error) => {
	logger.error("Failed to start application:", error);
	process.exit(1);
});
