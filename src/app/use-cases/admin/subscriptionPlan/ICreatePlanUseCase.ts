import { CreatePlanDTO } from "@/domain/dtos/admin/subscriptionPlan/CreatePlanDTO";
import { CreatePlanResponseDTO } from "@/domain/dtos/admin/subscriptionPlan/CreatePlanResponseDTO";
import { ResponseDTO } from "@/domain/dtos/Response";

export interface ICreatePlanUseCase {
  execute(dto: CreatePlanDTO): Promise<ResponseDTO & { data: CreatePlanResponseDTO | { error: string } }>;
}