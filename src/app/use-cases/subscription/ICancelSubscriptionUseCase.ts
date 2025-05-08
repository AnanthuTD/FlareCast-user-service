import { ResponseDTO } from "@/domain/dtos/Response";
import { CancelSubscriptionDTO } from "@/domain/dtos/subscription/CancelSubscriptionDTO";

export interface ICancelSubscriptionUseCase {
  execute(dto: CancelSubscriptionDTO): Promise<ResponseDTO>;
}