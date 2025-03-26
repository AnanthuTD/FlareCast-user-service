import { ResponseDTO } from "@/domain/dtos/Response";
import { CanSubscribeDTO } from "@/domain/dtos/subscription/CanSubscribeDTO";

export interface ICanSubscribeUseCase {
  execute(dto: CanSubscribeDTO): Promise<ResponseDTO>;
}