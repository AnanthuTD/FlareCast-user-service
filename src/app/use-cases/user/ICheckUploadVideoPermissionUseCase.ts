import { ResponseDTO } from "@/domain/dtos/Response";
import { CheckUploadVideoPermissionDTO } from "@/domain/dtos/user/CheckUploadVideoPermissionDTO";

export interface ICheckUploadVideoPermissionUseCase {
  execute(dto: CheckUploadVideoPermissionDTO): Promise<ResponseDTO>;
}