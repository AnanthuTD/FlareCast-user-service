import { UpdatePromotionalVideoDTO } from "@/domain/dtos/admin/promotionalVideo/UpdatePromotionalVideoDTO";
import { UpdatePromotionalVideoResponseDTO } from "@/domain/dtos/admin/promotionalVideo/UpdatePromotionalVideoResponseDTO";
import { ResponseDTO } from "@/domain/dtos/Response";

export interface IUpdatePromotionalVideoUseCase {
  execute(dto: UpdatePromotionalVideoDTO): Promise<ResponseDTO & { data: UpdatePromotionalVideoResponseDTO | { error: string } }>;
}