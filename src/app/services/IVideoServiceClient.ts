import { PromotionalVideoCategory } from "@/domain/entities/PromotionalVideo";

export interface IVideoServiceClient {
	getSignedUrl(params: {
		title?: string;
		description?: string;
		category: PromotionalVideoCategory;
		videoExtension: string;
	}): Promise<{
		message: string;
		signedUrl: string;
		videoId: string;
	}>;
}
