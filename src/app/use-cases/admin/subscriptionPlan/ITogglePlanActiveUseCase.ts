import { TogglePlanActiveDTO } from "@/domain/dtos/admin/subscriptionPlan/TogglePlanActiveDTO";
import { TogglePlanActiveResponseDTO } from "@/domain/dtos/admin/subscriptionPlan/TogglePlanActiveResponseDTO";
import { ResponseDTO } from "@/domain/dtos/Response";

export interface ITogglePlanActiveUseCase {
  execute(dto: TogglePlanActiveDTO): Promise<ResponseDTO & { data: TogglePlanActiveResponseDTO | { error: string } }>;
}