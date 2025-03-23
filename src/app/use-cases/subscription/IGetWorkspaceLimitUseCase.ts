import { ResponseDTO } from "@/domain/dtos/Response";
import { GetWorkspaceLimitDTO } from "@/domain/dtos/subscription/GetWorkspaceLimitDTO";

export interface IGetWorkspaceLimitUseCase {
  execute(dto: GetWorkspaceLimitDTO): Promise<ResponseDTO>;
}