import { ResponseDTO } from "@/domain/dtos/Response";
import { UserLoginDTO } from "@/domain/dtos/authenticate/UserLoginDTO";

export interface IUserLoginUseCase {
  execute(dto: UserLoginDTO): Promise<ResponseDTO>;
}