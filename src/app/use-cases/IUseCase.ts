import { ResponseDTO } from "@/domain/dtos/Response";

export interface IUseCase<TInput, TOutput> {
  execute(dto: TInput): Promise<ResponseDTO & { data: TOutput | { error: string; details?: any } }>;
}