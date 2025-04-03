import { GetPaginatedUsersDTO } from "@/domain/dtos/admin/GetPaginatedUsersDTO";
import { GetPaginatedUsersResponseDTO } from "@/domain/dtos/admin/GetPaginatedUsersResponseDTO";
import { ResponseDTO } from "@/domain/dtos/Response";

export interface IGetPaginatedUsersUseCase {
  execute(dto: GetPaginatedUsersDTO): Promise<ResponseDTO & { data: GetPaginatedUsersResponseDTO | { error: string } }>;
}