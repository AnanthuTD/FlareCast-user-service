import { ResponseDTO } from "@/domain/dtos/Response";
import { GetSubscriptionsDTO } from "@/domain/dtos/subscription/GetSubscriptionsDTO";

export interface IGetSubscriptionsUseCase {
  execute(dto: GetSubscriptionsDTO): Promise<ResponseDTO>;
}