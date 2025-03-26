import { ResponseDTO } from "@/domain/dtos/Response";
import { HandleSubscriptionWebhookDTO } from "@/domain/dtos/subscription/HandleSubscriptionWebhookDTO";

export interface IHandleSubscriptionWebhookUseCase {
  execute(dto: HandleSubscriptionWebhookDTO): Promise<ResponseDTO>;
}