import { UploadPromotionalVideoDTO } from "@/domain/dtos/admin/promotionalVideo/UploadPromotionalVideoDTO";
import { UploadPromotionalVideoResponseDTO } from "@/domain/dtos/admin/promotionalVideo/UploadPromotionalVideoResponseDTO";
import { ResponseDTO } from "@/domain/dtos/Response";

export interface IUploadPromotionalVideoUseCase {
  execute(dto: UploadPromotionalVideoDTO): Promise<ResponseDTO & { data: UploadPromotionalVideoResponseDTO | { error: string } }>;
}