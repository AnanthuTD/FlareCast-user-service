import { ResponseDTO } from "@/domain/dtos/Response";
import { UserExistDTO } from "@/domain/dtos/User/UserExistDTO";

export interface IUserExistUseCase {
  execute(dto: UserExistDTO): Promise<ResponseDTO>;
}