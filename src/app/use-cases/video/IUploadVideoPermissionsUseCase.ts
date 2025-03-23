import { ResponseDTO } from "@/domain/dtos/Response";
import { UploadVideoPermissionsDTO } from "@/domain/dtos/video/UploadVideoPermissionsDTO";

export interface IUploadVideoPermissionsUseCase {
  execute(dto: UploadVideoPermissionsDTO): Promise<ResponseDTO>;
}