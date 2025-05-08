import { GetPromotionalVideoByIdDTO } from "@/domain/dtos/admin/promotionalVideo/GetPromotionalVideoByIdDTO";
import { GetPromotionalVideoByIdResponseDTO } from "@/domain/dtos/admin/promotionalVideo/GetPromotionalVideoByIdResponseDTO";
import { ResponseDTO } from "@/domain/dtos/Response";

export interface IGetPromotionalVideoByIdUseCase {
  execute(dto: GetPromotionalVideoByIdDTO): Promise<ResponseDTO & { data: GetPromotionalVideoByIdResponseDTO | { error: string } }>;
}