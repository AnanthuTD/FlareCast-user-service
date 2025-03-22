import { PrismaClient } from "@prisma/client";
import { IPromotionalVideoRepository } from "@/app/repositories/IPromotionalVideoRepository";
import { logger } from "@/infra/logger";
import {  Inject } from "typedi";
import { TOKENS } from "@/app/tokens";

export class PromotionalVideoRepository implements IPromotionalVideoRepository {
	constructor(
		@Inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient
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
}
