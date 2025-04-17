import { GetPlansDTO } from "@/domain/dtos/subscription/GetPlansDTO";
import { IUseCase } from "../IUseCase";
import { GetUserPlansWithSubscriptionResponseDTO } from "@/domain/dtos/subscription/GetUserPlansWithSubscriptionResponseDTO";

export interface IGetUserPlansWithSubscriptionUseCase extends IUseCase<GetPlansDTO, GetUserPlansWithSubscriptionResponseDTO> {}