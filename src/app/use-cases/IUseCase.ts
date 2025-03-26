import { ResponseDTO } from "@/domain/dtos/Response";

export interface IUseCase<TInput, TOutput = void> {
  execute(dto: TInput): Promise<ResponseDTO & { data: TOutput | { error: string; details?: any } }>;
}