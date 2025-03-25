import { BanUserDTO } from "@/domain/dtos/admin/BanUserDTO";
import { BanUserResponseDTO } from "@/domain/dtos/admin/BanUserResponseDTO";
import { ResponseDTO } from "@/domain/dtos/Response";

export interface IBanUserUseCase {
  execute(dto: BanUserDTO): Promise<ResponseDTO & { data: BanUserResponseDTO | { error: string } }>;
}