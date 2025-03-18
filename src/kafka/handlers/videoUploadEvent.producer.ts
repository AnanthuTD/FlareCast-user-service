import { TOPICS } from "../../config/topics";
import { logger } from "../../logger/logger";
import { sendMessage } from "../producer";

export async function sendVideoUploadEvent(data: {
	s3Key: string;
	videoId: string;
	userId?: string;
	aiFeature?: boolean;
}) {
	logger.info(
		"Sending video upload event to kafka topic: " + TOPICS.VIDEO_UPLOAD_EVENT
	);
	const message = JSON.stringify(data);
	await sendMessage(TOPICS.VIDEO_UPLOAD_EVENT, message);
}
