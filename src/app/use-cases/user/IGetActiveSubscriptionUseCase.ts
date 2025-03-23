import { ResponseDTO } from "@/domain/dtos/Response";

export interface IGetActiveSubscriptionUseCase {
  execute(userId: string): Promise<ResponseDTO>;
}