import { createClient } from "redis";
import env from "../env";
import { logger } from "../logger/logger";

const redis = createClient({
	username: env.REDIS_USERNAME,
	password: env.REDIS_PASSWORD,
	socket: {
		host: env.REDIS_HOST,
		port: Number(env.REDIS_PORT),
	},
});

redis.on("error", (err) => console.error("Redis Client Error", err));

async function connectRedis() {
	try {
		await redis.connect();
		logger.info("✅ Connected to Redis");
	} catch (err) {
		logger.error("🔴 Redis connection failed:", err);
	}
}

connectRedis();

export default redis;
