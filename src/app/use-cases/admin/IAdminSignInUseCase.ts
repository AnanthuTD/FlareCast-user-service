import { AdminSignInDTO } from "@/domain/dtos/admin/authentication/AdminSignInDTO";
import { AdminSignInResponseDTO } from "@/domain/dtos/admin/authentication/AdminSignInResponseDTO";
import { ResponseDTO } from "@/domain/dtos/Response";

export interface IAdminSignInUseCase {
  execute(dto: AdminSignInDTO): Promise<ResponseDTO & { data: AdminSignInResponseDTO | { error: string } }>;
}