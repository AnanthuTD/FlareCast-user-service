import { ResponseDTO } from "@/domain/dtos/Response";
import { GoogleSignInDTO } from "@/domain/dtos/authenticate/GoogleSignInDTO";

export interface IGoogleSignInUseCase {
  execute(dto: GoogleSignInDTO): Promise<ResponseDTO>;
}