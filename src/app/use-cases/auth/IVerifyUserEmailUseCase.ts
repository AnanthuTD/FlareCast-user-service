import { ResponseDTO } from "@/domain/dtos/Response";

export interface IVerifyUserEmailUseCase {
  execute(userId: string): Promise<ResponseDTO>;
}