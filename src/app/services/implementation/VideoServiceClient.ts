import { injectable } from "inversify";
import axios from "axios";
import CircuitBreaker from "opossum";
import { IVideoServiceClient } from "@/app/services/IVideoServiceClient";
import env from "@/infra/env";
import { logger } from "@/infra/logger";

@injectable()
export class VideoServiceClient implements IVideoServiceClient {
  private readonly videoServiceBreaker: CircuitBreaker;

  constructor() {
    const callVideoService = async (body: {
      title?: string;
      description?: string;
      type: string;
      videoExtension: string;
    }) => {
      const { data } = await axios.post(
        `${env.VIDEO_SERVICE}/api/interservice/promotional-video`,
        body,
        { timeout: 2000 }
      );
      return data;
    };

    this.videoServiceBreaker = new CircuitBreaker(callVideoService, {
      timeout: 2000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    });

    this.videoServiceBreaker.on("open", () =>
      logger.info("Circuit opened for video service")
    );
    this.videoServiceBreaker.on("halfOpen", () =>
      logger.info("Circuit half-open for video service")
    );
    this.videoServiceBreaker.on("close", () =>
      logger.info("Circuit closed for video service")
    );
  }

  async getSignedUrl(params: {
    title?: string;
    description?: string;
    type: string;
    videoExtension: string;
  }): Promise<{
    message: string;
    signedUrl: string;
    videoId: string;
  }> {
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await this.videoServiceBreaker.fire(params);
        return result;
      } catch (error) {
        lastError = error;
        logger.warn(`Attempt ${attempt + 1} failed: ${error instanceof Error ? error.message : error}`);

        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
      }
    }

    logger.error("Failed to fetch signed URL after retries:", {
      message: lastError.message,
      stack: lastError.stack,
    });
    throw lastError;
  }
}