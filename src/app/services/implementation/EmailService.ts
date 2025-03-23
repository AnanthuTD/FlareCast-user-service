import { injectable } from "inversify";
import { IEmailService } from "@/app/services/IEmailService";
import axios from "axios";
import env from "@/infra/env";
import { logger } from "@/infra/logger";

@injectable()
export class EmailService implements IEmailService {
  async isUserVerified(userId: string): Promise<boolean> {
    try {
      const { data } = await axios.get(
        `${env.EMAIL_SERVICE_URL}/api/isVerified/${userId}`
      );
      return data.verified;
    } catch (err: any) {
      logger.error("Failed to check if user is verified:", err.message);
      throw new Error("Failed to verify user status");
    }
  }
}