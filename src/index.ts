import app from "./app";
import env from "./env";
import { logger } from "./logger/logger";

const start = async () => {
	try {
		app.listen(env.PORT, () => {
			logger.info(`Server running at http://localhost:${env.PORT}`);
		});
	} catch (err) {
		logger.error(`Error starting the server: ${(err as Error).message}`);
	}
};

start();
