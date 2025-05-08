import { ResponseDTO } from "@/domain/dtos/Response";

export interface IGetPlansUseCase {
  execute(): Promise<ResponseDTO>;
}