import { injectable } from "inversify";
import { IEmailService } from "@/app/services/IEmailService";
import axios from "axios";
import env from "@/infra/env";
import { logger } from "@/infra/logger";
import CircuitBreaker from "opossum";

@injectable()
export class EmailService implements IEmailService {
  private breaker: CircuitBreaker;

  constructor() {
    // Function to call the email service
    const callEmailService = async (userId: string) => {
      const { data } = await axios.get(
        `${env.EMAIL_SERVICE_URL}/api/isVerified/${userId}`,
        { timeout: 2000 } // 2-second timeout per request
      );
      console.log(data);
      return data.verified;
    };

    // Circuit Breaker options
    this.breaker = new CircuitBreaker(callEmailService, {
      timeout: 2000, // Timeout after 2 seconds
      errorThresholdPercentage: 50, // Trip if 50% of requests fail
      resetTimeout: 30000, // Retry after 30 seconds
    });

    // Log circuit state changes
    this.breaker.on("open", () => logger.warn("Circuit opened for email service"));
    this.breaker.on("halfOpen", () => logger.info("Circuit half-open for email service"));
    this.breaker.on("close", () => logger.info("Circuit closed for email service"));
  }

  async isUserVerified(userId: string): Promise<boolean> {
    const maxRetries = 3;
    let lastError: any;

    // Retry logic
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.breaker.fire(userId);
        return result;
      } catch (err: any) {
        lastError = err;
        logger.warn(`Attempt ${attempt + 1} failed for user ${userId}: ${err.message}`);
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt))); // Exponential backoff: 1s, 2s, 4s
        }
      }
    }

    // All retries failed or circuit is open
    logger.error(`Failed to check if user ${userId} is verified after ${maxRetries} attempts: ${lastError.message}`);
    throw new Error("Failed to verify user status");
  }
}