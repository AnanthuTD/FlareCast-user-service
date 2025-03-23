import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IEventService } from "@/app/services/IEventService";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { IPublishUserVerifiedEventUseCase } from "../IPublishUserVerifiedEventUseCase";

@injectable()
export class PublishUserVerifiedEventUseCase implements IPublishUserVerifiedEventUseCase {
  constructor(
    @inject(TOKENS.EventService)
    private readonly eventService: IEventService
  ) {}

  async execute(event: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    image: string;
    plan: any;
  }): Promise<ResponseDTO> {
    try {
      await this.eventService.publishUserVerifiedEvent(event);
      return {
        success: true,
        data: { message: "User verified event published" },
      };
    } catch (err: any) {
      logger.error("Error publishing user verified event:", err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}