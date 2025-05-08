import { GetPromotionalVideoDTO } from "@/domain/dtos/admin/promotionalVideo/GetPromotionalVideoDTO";
import { GetPromotionalVideosResponseDTO } from "@/domain/dtos/admin/promotionalVideo/GetPromotionalVideosResponseDTO";
import { ResponseDTO } from "@/domain/dtos/Response";

export interface IGetPromotionalVideosUseCase {
	execute(
		dto: GetPromotionalVideoDTO
	): Promise<
		ResponseDTO & { data: GetPromotionalVideosResponseDTO | { error: string } }
	>;
}
