import { ResponseDTO } from "@/domain/dtos/Response";
import { CreateSubscribeDTO } from "@/domain/dtos/subscription/CreateSubscribeDTO";

export interface ICreateSubscribeUseCase {
  execute(dto: CreateSubscribeDTO): Promise<ResponseDTO>;
}