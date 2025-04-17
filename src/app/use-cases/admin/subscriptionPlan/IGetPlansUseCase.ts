import { ResponseDTO } from "@/domain/dtos/Response";
import { GetPlansResponseDTO } from "@/domain/dtos/subscription/GetUserPlansWithSubscriptionResponseDTO";

export interface IGetPlansUseCase {
  execute(): Promise<ResponseDTO & { data: GetPlansResponseDTO | { error: string } }>;
}