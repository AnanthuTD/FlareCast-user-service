import { GetPaginatedPaymentsDTO } from "@/domain/dtos/admin/monetization/GetPaginatedPaymentsDTO";
import { ResponseDTO } from "@/domain/dtos/Response";
import { GetPaginatedPaymentsResponseDTO } from "../../../../domain/dtos/admin/monetization/GetPaginatedPaymentsResponseDTO";

export interface IGetPaginatedPaymentsUseCase {
  execute(dto: GetPaginatedPaymentsDTO): Promise<ResponseDTO & { data: GetPaginatedPaymentsResponseDTO | { error: string } }>;
}