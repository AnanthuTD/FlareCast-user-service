import { ResponseDTO } from "@/domain/dtos/Response";
import { GetUserProfileDTO } from "@/domain/dtos/user/GetUserProfileDTO";

export interface IGetUserProfileUseCase {
  execute(dto: GetUserProfileDTO): Promise<ResponseDTO>;
}