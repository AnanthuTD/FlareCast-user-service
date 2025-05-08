import { ResponseDTO } from "@/domain/dtos/Response";
import { ElectronPostLoginDTO } from "@/domain/dtos/authenticate/ElectronPostLoginDTO";

export interface IElectronPostLoginUseCase {
  execute(dto: ElectronPostLoginDTO): Promise<ResponseDTO>;
}