import { DeletePlanDTO } from "@/domain/dtos/admin/subscriptionPlan/DeletePlanDTO";
import { DeletePlanResponseDTO } from "@/domain/dtos/admin/subscriptionPlan/DeletePlanResponseDTO";
import { ResponseDTO } from "@/domain/dtos/Response";

export interface IDeletePlanUseCase {
  execute(dto: DeletePlanDTO): Promise<ResponseDTO & { data: DeletePlanResponseDTO | { error: string } }>;
}