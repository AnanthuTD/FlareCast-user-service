import { DeletePromotionalVideoDTO } from "@/domain/dtos/admin/promotionalVideo/DeletePromotionalVideoDTO";
import { DeletePromotionalVideoResponseDTO } from "@/domain/dtos/admin/promotionalVideo/DeletePromotionalVideoResponseDTO";
import { ResponseDTO } from "@/domain/dtos/Response";

export interface IDeletePromotionalVideoUseCase {
  execute(dto: DeletePromotionalVideoDTO): Promise<ResponseDTO & { data: DeletePromotionalVideoResponseDTO | { error: string } }>;
}