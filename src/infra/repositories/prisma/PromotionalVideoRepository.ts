import { PrismaClient } from "@prisma/client";
import { IPromotionalVideoRepository } from "@/app/repositories/IPromotionalVideoRepository";
import { logger } from "@/infra/logger";
import { TOKENS } from "@/app/tokens";
import { inject, injectable } from "inversify";

@injectable()
export class PromotionalVideoRepository implements IPromotionalVideoRepository {
	constructor(
		@inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient
	) {}

	async updateTitleAndDescription(
		videoId: string,
		title: string,
		description: string
	): Promise<void> {
		try {
			await this.prisma.promotionalVideo.update({
				where: { videoId },
				data: {
					title: title || "",
					description: description || "",
				},
			});
		} catch (error) {
			logger.error(
				`Failed to update title and description for video ${videoId}:`,
				error
			);
			throw new Error(
				`Failed to update title and description for video ${videoId}: ${error.message}`
			);
		}
	}

	async create(data: {
		category: "PROMOTIONAL" | "NEW_FEATURE";
		hidden: boolean;
		videoId: string;
		priority: number;
		startDate: Date | null;
		endDate: Date | null;
		title: string | null;
		description: string | null;
		createdBy: string;
	}): Promise<{
		id: string;
		category: string;
		hidden: boolean;
		videoId: string;
		priority: number;
		startDate?: Date | null;
		endDate?: Date | null;
		title?: string | null;
		description?: string | null;
		createdBy: string;
		createdAt: Date;
		updatedAt: Date;
	}> {
		try {
			const promoVideo = await this.prisma.promotionalVideo.create({
				data,
			});
			return promoVideo;
		} catch (err: any) {
			logger.error("Error creating promotional video:", {
				message: err.message,
				stack: err.stack,
			});
			throw err;
		}
	}

	async findVideos({
		limit,
		skip = 0,
	}: {
		limit?: number;
		skip?: number;
	}): Promise<
		Array<{
			id: string;
			category: string;
			hidden: boolean;
			videoId: string;
			priority: number;
			startDate?: Date | null;
			endDate?: Date | null;
			title?: string | null;
			description?: string | null;
			createdBy: string;
			createdAt: Date;
			updatedAt: Date;
		}>
	> {
		try {
			const videos = await this.prisma.promotionalVideo.findMany({
				orderBy: { priority: "asc" },
				...(limit ? { take: limit } : {}),
				skip,
			});
			return videos;
		} catch (err: any) {
			logger.error("Error fetching active promotional videos:", {
				message: err.message,
				stack: err.stack,
			});
			throw err;
		}
	}

	async findById(id: string): Promise<{
		id: string;
		category: string;
		hidden: boolean;
		videoId: string;
		priority: number;
		startDate?: Date | null;
		endDate?: Date | null;
		title?: string | null;
		description?: string | null;
		createdBy: string;
		createdAt: Date;
		updatedAt: Date;
	} | null> {
		try {
			const video = await this.prisma.promotionalVideo.findUnique({
				where: { id },
			});
			return video;
		} catch (err: any) {
			logger.error(`Error fetching promotional video ${id}:`, {
				message: err.message,
				stack: err.stack,
			});
			throw err;
		}
	}

	async update(dto: {
		id: string;
		category?: string;
		hidden?: boolean;
		priority?: number;
		startDate?: string;
		endDate?: string;
		title?: string;
		description?: string;
		createdBy?: string;
	}): Promise<{
		id: string;
		category: string;
		hidden: boolean;
		videoId: string;
		priority: number;
		startDate?: Date | null;
		endDate?: Date | null;
		title?: string | null;
		description?: string | null;
		createdBy: string;
		createdAt: Date;
		updatedAt: Date;
	}> {
		try {
			const updatedVideo = await this.prisma.promotionalVideo.update({
				where: { id: dto.id },
				data: {
					category: dto.category ? dto.category.toUpperCase() : undefined,
					hidden: dto.hidden,
					priority: dto.priority,
					startDate: dto.startDate ? new Date(dto.startDate) : undefined,
					endDate: dto.endDate ? new Date(dto.endDate) : undefined,
					title: dto.title !== undefined ? dto.title : undefined,
					description:
						dto.description !== undefined ? dto.description : undefined,
					createdBy: dto.createdBy,
				},
			});
			return updatedVideo;
		} catch (err: any) {
			logger.error(`Error updating promotional video ${dto.id}:`, {
				message: err.message,
				stack: err.stack,
			});
			throw err;
		}
	}

	async delete(id: string): Promise<void> {
		try {
			await this.prisma.promotionalVideo.delete({
				where: { id },
			});
		} catch (err: any) {
			logger.error(`Error deleting promotional video ${id}:`, {
				message: err.message,
				stack: err.stack,
			});
			throw err;
		}
	}

	async count(): Promise<number> {
		try {
			return this.prisma.promotionalVideo.count();
		} catch (error) {
			logger.error("Error on getting promotional video count: ", error);
			return 0;
		}
	}
}
