import { GetSignedUrlDTO } from "@/domain/dtos/admin/promotionalVideo/GetSignedUrlDTO";
import { GetSignedUrlResponseDTO } from "@/domain/dtos/admin/promotionalVideo/GetSignedUrlResponseDTO";
import { ResponseDTO } from "@/domain/dtos/Response";

export interface IGetSignedUrlUseCase {
  execute(dto: GetSignedUrlDTO): Promise<ResponseDTO & { data: GetSignedUrlResponseDTO | { error: string } }>;
}