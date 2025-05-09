import { NextFunction, Request, RequestHandler, Response } from "express";
import prisma from "../../prismaClient";
import axios from "axios";
import env from "../../env";
import { sendVideoUploadEvent } from "../../kafka/handlers/videoUploadEvent.producer";
import HttpStatusCodes from "../../common/HttpStatusCodes";

export class PromotionalVideoController {
	// Get signed URL for direct S3 upload
	static getSignedUrl: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const { title, description, fileName } = req.body;

			if (!fileName) {
				return res.status(HttpStatusCodes.BAD_REQUEST).json({ error: "fileName is required" });
			}

			const videoExtension = fileName.split(".").pop();
			if (!["mp4", "webm"].includes(videoExtension?.toLowerCase() || "")) {
				return res
					.status(HttpStatusCodes.BAD_REQUEST)
					.json({ error: "Invalid video extension. Use mp4 or webm" });
			}

			const { data: createPromotionalVideo } = await axios.post(
				`${env.VIDEO_SERVICE}/api/interservice/promotional-video`,
				{
					title,
					description,
					type: "PROMOTIONAL",
					videoExtension,
				}
			);

			const { signedUrl, videoId } = createPromotionalVideo;
			if (!videoId || !signedUrl) {
				throw new Error("Missing videoId or signedUrl from external service");
			}

			res.json({ message: createPromotionalVideo.message, signedUrl, videoId });
		} catch (error) {
			console.error("Error fetching signed URL:", error);
			res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to fetch signed URL" });
		}
	};

	// Create promotional video entry after S3 upload
	static uploadPromotionalVideo: RequestHandler = async (
		req: Request,
		res: Response
	) => {
		try {
			const {
				category,
				hidden = "true",
				priority = "0",
				startDate,
				endDate,
				title,
				description,
				videoId,
				s3Key,
			} = req.body;

			// Validation
			if (!videoId || !s3Key) {
				return res
					.status(HttpStatusCodes.BAD_REQUEST)
					.json({ error: "videoId and s3Key are required" });
			}
			if (!["PROMOTIONAL", "NEW_FEATURE"].includes(category?.toUpperCase())) {
				return res.status(HttpStatusCodes.BAD_REQUEST).json({ error: "Invalid category" });
			}
			const priorityNum = parseInt(priority, 10);
			if (isNaN(priorityNum)) {
				return res.status(HttpStatusCodes.BAD_REQUEST).json({ error: "Priority must be a number" });
			}

			// Trigger processing (assumes sendVideoUploadEvent handles it)
			await sendVideoUploadEvent({
				s3Key,
				videoId,
				aiFeature: !(title || description), // Disable AI if title/description provided
			});

			// Create PromotionalVideo entry
			const promoVideo = await prisma.promotionalVideo.create({
				data: {
					category: category.toUpperCase() as "PROMOTIONAL" | "NEW_FEATURE",
					hidden: hidden === "true" || hidden === true,
					videoId,
					priority: priorityNum,
					startDate: startDate ? new Date(startDate) : null,
					endDate: endDate ? new Date(endDate) : null,
					title: title || null,
					description: description || null,
					createdBy: req.user?.id || "defaultAdminId", // Fallback if auth fails
				},
			});

			res.status(HttpStatusCodes.CREATED).json({
				message: "Promotional video metadata saved",
				data: promoVideo,
			});
		} catch (error) {
			console.error("Error creating promotional video:", error);
			res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: (error as Error).message });
		}
	};
	// Read: Get all promotional videos
	static getPromotionalVideos: RequestHandler = async (
		req: Request,
		res: Response
	) => {
		try {
			const videos = await prisma.promotionalVideo.findMany({
				where: {
					AND: [
						{ OR: [{ endDate: { gte: new Date() } }, { endDate: null }] },
						{ OR: [{ startDate: { lte: new Date() } }, { startDate: null }] },
					],
				},
				orderBy: { priority: "asc" },
			});
			res.status(HttpStatusCodes.OK).json({ data: videos });
		} catch (error) {
			console.error("Error fetching promotional videos:", error);
			res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: (error as Error).message });
		}
	};

	// Read: Get a single promotional video by ID
	static getPromotionalVideoById: RequestHandler = async (
		req: Request,
		res: Response
	) => {
		const { id } = req.params;
		try {
			const video = await prisma.promotionalVideo.findUnique({
				where: { id },
			});
			if (!video) {
				return res.status(HttpStatusCodes.NOT_FOUND).json({ error: "Promotional video not found" });
			}
			res.status(HttpStatusCodes.OK).json({ data: video });
		} catch (error) {
			console.error("Error fetching promotional video:", error);
			res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: (error as Error).message });
		}
	};

	// Update: Modify a promotional video
	static updatePromotionalVideo: RequestHandler = async (
		req: Request,
		res: Response
	) => {
		const { id } = req.params;
		const {
			category,
			hidden,
			priority,
			startDate,
			endDate,
			title,
			description,
			createdBy,
		} = req.body;

		try {
			const video = await prisma.promotionalVideo.findUnique({ where: { id } });
			if (!video) {
				return res.status(HttpStatusCodes.NOT_FOUND).json({ error: "Promotional video not found" });
			}

			const updatedVideo = await prisma.promotionalVideo.update({
				where: { id },
				data: {
					category: category ? category.toUpperCase() : undefined,
					hidden:
						hidden !== undefined
							? hidden === "true" || hidden === true
							: undefined,
					priority: priority ? parseInt(priority, 10) : undefined,
					startDate: startDate ? new Date(startDate) : undefined,
					endDate: endDate ? new Date(endDate) : undefined,
					title: title !== undefined ? title : undefined,
					description: description !== undefined ? description : undefined,
					createdBy: createdBy || undefined,
				},
			});

			res.status(HttpStatusCodes.OK).json({
				message: "Promotional video updated",
				data: updatedVideo,
			});
		} catch (error) {
			console.error("Error updating promotional video:", error);
			res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: (error as Error).message });
		}
	};

	// Delete: Remove a promotional video
	static deletePromotionalVideo: RequestHandler = async (
		req: Request,
		res: Response
	) => {
		const { id } = req.params;
		try {
			const video = await prisma.promotionalVideo.findUnique({ where: { id } });
			if (!video) {
				return res.status(HttpStatusCodes.NOT_FOUND).json({ error: "Promotional video not found" });
			}

			await prisma.promotionalVideo.delete({ where: { id } });
			res.status(HttpStatusCodes.OK).json({ message: "Promotional video deleted" });
		} catch (error) {
			console.error("Error deleting promotional video:", error);
			res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ error: (error as Error).message });
		}
	};
}
