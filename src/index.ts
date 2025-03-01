import "reflect-metadata";
import app from "./app";
import env from "./env";
import { logger } from "./logger/logger";
import { createServer } from "node:http";
import { initializeSocket } from "./config/socket";

const start = async () => {
	try {
		const server = createServer(app);
		initializeSocket(server)
		server.listen(env.PORT, () => {
			logger.info(`Server running at http://localhost:${env.PORT}`);
		});
	} catch (err) {
		logger.error(`Error starting the server: ${(err as Error).message}`);
	}
};

start();
