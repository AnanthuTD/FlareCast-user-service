import { logger } from "../../logger/logger";
import EventName from "../../eventEmitter/eventNames";
import eventEmitter from "../../eventEmitter";
import prisma from "../../prismaClient";

enum VideoStatus {
	SUCCESS = "success",
	FAILED = "failed",
	PROCESSING = "processing",
}

export async function handleTitleAndSummary(value: {
	title: string;
	description: string;
	videoId: string;
	status: VideoStatus;
	userId: string;
}) {
	logger.info(
		`⌛ New title and summary event received, status: ${
			value.status === VideoStatus.SUCCESS
				? "🟢 success"
				: value.status === VideoStatus.FAILED
				? "🔴 failed"
				: "🟡 processing"
		}`,
		value
	);

	if (!value.status) {
		logger.info(
			"🟡 Skipping title and summary update for video\t" +
				JSON.stringify({ videoId: value.videoId })
		);
		return;
	}

	try {
		logger.info(
			`⌛ Updating title and description for video: ${JSON.stringify(
				value,
				null,
				2
			)}`
		);

		prisma.promotionalVideo.update({
			where: { videoId: value.videoId },
			data: {
				title: value.title || "",
				description: value.description || "",
			},
		});

		// Replacing event emitter with direct function call
		/* await handleVideoStatusUpdateEvent({
			videoId: value.videoId,
			status: value.status,
			message: "Title and description updated successfully",
			event: "title-description",
		}); */

		logger.info("✅ Title and description updated successfully!");
	} catch (error) {
		logger.error(
			`🔴 Error updating title and description for video ${value.videoId}`,
			{ error }
		);
	}

	/* try {
		eventEmitter.emit(EventName.TITLE_SUMMARY, {
			videoId: value.videoId,
			status: value.status,
			title: value.status === VideoStatus.SUCCESS ? value.title : undefined,
			description:
				value.status === VideoStatus.SUCCESS ? value.description : undefined,
			userId: value.userId,
		});

		if (value.status === VideoStatus.SUCCESS) {
			logger.info(
				`⌛ Updating title and description for video: ${JSON.stringify(
					value,
					null,
					2
				)}`
			);
			logger.info("✅ Title and description updated successfully!");
		}

		await VideoRepository.updateTitleAndDescription(
			value.videoId,
			value.title,
			value.description,
			value.status
		);

		// Replacing event emitter with direct function call
		await handleVideoStatusUpdateEvent({
			videoId: value.videoId,
			status: value.status,
			message: "Title and description updated successfully",
			event: "title-description",
		});
	} catch (error) {
		logger.error(
			`🔴 Error updating title and description for video ${value.videoId}`,
			{ error }
		);
	} */
}
