import { ResponseDTO } from "@/domain/dtos/Response";
import { GetPlansResponseDTO } from "@/domain/dtos/subscription/GetPlansResponseDTO";

export interface IGetPlansUseCase {
  execute(): Promise<ResponseDTO & { data: GetPlansResponseDTO | { error: string } }>;
}