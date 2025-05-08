import { ResponseDTO } from "@/domain/dtos/Response";
import { SignUpDTO } from "@/domain/dtos/authenticate/SignUpDTO";

export interface ISignUpUseCase {
  execute(dto: SignUpDTO): Promise<ResponseDTO>;
}