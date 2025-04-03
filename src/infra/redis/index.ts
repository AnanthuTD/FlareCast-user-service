import { createClient } from "redis";
import env from "../env";
import { logger } from "../logger";

// Configuration for retry mechanism
const RETRY_INTERVAL = 5000;
const MAX_RETRIES = 10;

const redis = createClient({
	username: env.REDIS_USERNAME,
	password: env.REDIS_PASSWORD,
	socket: {
		host: env.REDIS_HOST,
		port: Number(env.REDIS_PORT),
	},
});

// Track retry attempts
let retryCount = 0;

redis.on("error", (err) => {
	logger.error("Redis Client Error:", err);
});

redis.on("reconnecting", () => {
	logger.info(`Reconnecting to Redis (attempt ${retryCount + 1})...`);
});

redis.on("ready", () => {
	logger.info("✅ Connected to Redis");
	retryCount = 0; // Reset retry count on successful connection
});

redis.on("end", () => {
	logger.warn("Redis connection closed.");
});

export async function connectRedis() {
	const connect = async () => {
		try {
			await redis.connect();
			logger.info("✅ Redis connection established");
		} catch (err) {
			logger.error("🔴 Redis connection failed:", err);

			if (MAX_RETRIES && retryCount >= MAX_RETRIES) {
				logger.error(
					`Max retries (${MAX_RETRIES}) reached. Giving up on Redis connection.`
				);
				return;
			}

			retryCount++;
			const delay = RETRY_INTERVAL;
			// const delay = Math.min(RETRY_INTERVAL * Math.pow(2, retryCount), 30000); // Caps at 30s

			logger.info(
				`Retrying Redis connection in ${
					delay / 1000
				} seconds (attempt ${retryCount})...`
			);
			setTimeout(connect, delay);
		}
	};

	// Initial connection attempt
	await connect();
}

export default redis;
