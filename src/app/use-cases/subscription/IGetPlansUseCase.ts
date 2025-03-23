import { ResponseDTO } from "@/domain/dtos/Response";
import { GetPlansDTO } from "@/domain/dtos/subscription/GetPlansDTO";

export interface IGetPlansUseCase {
  execute(dto: GetPlansDTO): Promise<ResponseDTO>;
}