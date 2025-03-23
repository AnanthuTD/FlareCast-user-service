import { ResponseDTO } from "@/domain/dtos/Response";
import { GetMemberLimitDTO } from "@/domain/dtos/subscription/GetMemberLimitDTO";

export interface IGetMemberLimitUseCase {
  execute(dto: GetMemberLimitDTO): Promise<ResponseDTO>;
}