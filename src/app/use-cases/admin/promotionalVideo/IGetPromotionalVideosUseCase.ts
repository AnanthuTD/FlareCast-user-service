import { GetPromotionalVideosResponseDTO } from "@/domain/dtos/admin/promotionalVideo/GetPromotionalVideosResponseDTO";
import { ResponseDTO } from "@/domain/dtos/Response";

export interface IGetPromotionalVideosUseCase {
  execute(): Promise<ResponseDTO & { data: GetPromotionalVideosResponseDTO | { error: string } }>;
}