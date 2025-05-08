import { injectable } from "inversify";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { IS3Service } from "@/app/services/IS3Service";
import env from "@/infra/env";
import { logger } from "@/infra/logger";

@injectable()
export class S3Service implements IS3Service {
  private readonly s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: env.AWS_REGION,
    });
  }

  async uploadProfileImage(
    userId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string }
  ): Promise<string> {
    const extension = file.originalname.split(".").pop() || "jpg";
    const key = `profile/${userId}.${extension}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const imageUrl = `${env.AWS_CLOUDFRONT_URL}/${key}`;
    logger.debug(`Uploaded image to S3: ${imageUrl}`);
    return imageUrl;
  }
}