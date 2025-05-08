import { ResponseDTO } from "@/domain/dtos/Response";
import { UserLogoutDTO } from "@/domain/dtos/authenticate/UserLogoutDTO";

export interface IAdminLogoutUseCase {
  execute(dto: UserLogoutDTO): Promise<ResponseDTO>;
}