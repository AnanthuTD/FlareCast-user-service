import { ResponseDTO } from "@/domain/dtos/Response";

export interface IPublishUserVerifiedEventUseCase {
  execute(event: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    image: string;
    plan?: any;
  }): Promise<ResponseDTO>;
}