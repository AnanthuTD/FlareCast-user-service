import { GetPlansAdminDto } from "@/domain/dtos/admin/subscriptionPlan/GetPlansAdminDto";
import { GetPlansResponseDTO } from "@/domain/dtos/admin/subscriptionPlan/GetPlansResponseDTO";
import { ResponseDTO } from "@/domain/dtos/Response";

export interface IGetPlansUseCase {
	execute(
		dto: GetPlansAdminDto
	): Promise<ResponseDTO & { data: GetPlansResponseDTO | { error: string } }>;
}
