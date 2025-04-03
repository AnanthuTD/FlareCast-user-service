import { ResponseDTO } from "@/domain/dtos/Response";
import { UpdateProfileDTO } from "@/domain/dtos/user/UpdateProfileDTO";

export interface IUpdateProfileUseCase {
  execute(dto: UpdateProfileDTO): Promise<ResponseDTO>;
}