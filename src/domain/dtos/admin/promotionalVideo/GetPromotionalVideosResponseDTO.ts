export interface GetPromotionalVideosResponseDTO {
	videos: Array<{
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
	}>;
	total: number;
}
