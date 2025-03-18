import { RequestHandler } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import bcrypt from "bcryptjs";
import prisma from "../../prismaClient";
import env from "../../env";
import { logger } from "../../logger/logger";
import multer from "multer";
import HttpStatusCodes from "../../common/HttpStatusCodes";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  image?: string;
  hashedPassword?: string;
  trial: boolean;
  role: "USER" | "ADMIN";
  watchLater: string[];
  trail: boolean;
  extraVideoCount: number;
  referralId?: string;
  isVerified: boolean;
  isBanned: boolean;
}

// Configure multer for file upload (store in memory for S3 upload)
const upload = multer({ storage: multer.memoryStorage() });

export const updateProfileController: RequestHandler = async (
  req: any, // Use any or create a custom type for multer request
  res
) => {
  const userId = req.user.id; // Assuming authentication middleware sets req.user
  const { firstName, lastName, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    }) as User | null;

    if (!user) {
      return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "User not found" });
    }

    let updatedImage = user.image;

    console.log(req.file)

    // Handle image upload if present
    if (req.file) {
      const file = req.file;
      const extension = file.originalname.split(".").pop() || "jpg";
      const key = `profile/${userId}.${extension}`;

      const s3Client = new S3Client({
        region: env.AWS_REGION,
      });

      await s3Client.send(
        new PutObjectCommand({
          Bucket: env.AWS_S3_BUCKET_NAME,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        })
      );

      updatedImage = `${env.AWS_CLOUDFRONT_URL}/${key}`;
      console.log(updatedImage);
    }

    let updatedPassword: string | undefined = user.hashedPassword;
    if (password) {
      // Hash the new password if provided
      const saltRounds = 10;
      updatedPassword = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName: lastName || null,
        hashedPassword: updatedPassword || null,
        image: updatedImage || null,
      },
    });

    console.log(updatedUser);

    logger.info(`User ${userId} updated profile successfully`);
    return res.status(HttpStatusCodes.OK).json(updatedUser);
  } catch (error) {
    logger.error(
      `Failed to update profile for user ${userId}: ${error.message}`
    );
    return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to update profile" });
  }
};

// Middleware to handle file upload
export const uploadMiddleware = upload.single("image");