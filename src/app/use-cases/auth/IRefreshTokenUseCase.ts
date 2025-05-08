import { ResponseDTO } from "@/domain/dtos/Response";
import { RefreshTokenDTO } from "@/domain/dtos/authenticate/RefreshTokenDTO";

export interface IRefreshTokenUseCase {
  execute(dto: RefreshTokenDTO): Promise<ResponseDTO>;
}