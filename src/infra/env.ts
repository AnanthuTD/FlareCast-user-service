import { cleanEnv, str, port, url, host, bool } from "envalid";

const env = cleanEnv(process.env, {
	NODE_ENV: str({
		choices: ["development", "test", "production", "staging"],
	}),
	isProduction: bool({ default: process.env.NODE_ENV === "production" }),
	PORT: port(),
	DATABASE_URL: url(),

	ACCESS_TOKEN_SECRET: str(),
	REFRESH_TOKEN_SECRET: str(),

	ADMIN_ACCESS_TOKEN_SECRET: str(),
	ADMIN_REFRESH_TOKEN_SECRET: str(),

	GOOGLE_CLIENT_ID: str(),
	KAFKA_BROKER: str(),

	GRAFANA_HOST: str(),
	LOKI_API_KEY: str(),
	LOKI_USER_ID: str(),

	EMAIL_SERVICE_URL: url(),

	// redis
	REDIS_HOST: host(),
	REDIS_PORT: port(),
	REDIS_USERNAME: str(),
	REDIS_PASSWORD: str(),

	// razorpay
	RAZORPAY_SECRET: str(),
	RAZORPAY_KEY_ID: str(),
	RAZORPAY_WEBHOOK_SECRET: str(),

	AWS_CLOUDFRONT_URL: str(),
	AWS_REGION: str(),
	AWS_ACCESS_KEY_ID: str(),
	AWS_SECRET_ACCESS_KEY: str(),
	AWS_S3_BUCKET_NAME: str(),

	VIDEO_SERVICE: str(),
});

export default env;
