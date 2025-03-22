import { IHttpErrors } from "@/presentation/http/helpers/IHttpErrors";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { IHttpResponse } from "@/presentation/http/helpers/IHttpResponse";
import { IHttpSuccess } from "@/presentation/http/helpers/IHttpSuccess";
import { HttpResponse } from "@/presentation/http/helpers/implementations/HttpResponse";
import { IController } from "@/presentation/http/controllers/IController";
import { ResponseDTO } from "@/domain/dtos/Response";
import { logger } from "@/infra/logger";
import { Inject } from "typedi";
import env from "@/infra/env";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { IPasswordHasher } from "@/app/providers/IPasswordHasher";
import { TOKENS } from "@/app/tokens";

/**
 * Controller for handling user profile update requests.
 */
export class UpdateProfileController implements IController {
	constructor(
		@Inject(TOKENS.UserRepository)
		private readonly userRepository: IUsersRepository,
		@Inject(TOKENS.HttpErrors) private readonly httpErrors: IHttpErrors,
		@Inject(TOKENS.HttpSuccess) private readonly httpSuccess: IHttpSuccess,
		@Inject(TOKENS.PasswordHasher)
		private readonly passwordHasher: IPasswordHasher
	) {}

	async handle(httpRequest: IHttpRequest): Promise<IHttpResponse> {
		let error;
		let response: ResponseDTO;

		if (!httpRequest.user || !httpRequest.user.id) {
			error = this.httpErrors.error_401();
			return new HttpResponse(error.statusCode, { message: "Unauthorized" });
		}

		const userId = httpRequest.user.id;
		const { firstName, lastName, password } = httpRequest.body as {
			firstName?: string;
			lastName?: string;
			password?: string;
		};

		try {
			const user = await this.userRepository.findById(userId);
			if (!user) {
				error = this.httpErrors.error_404();
				return new HttpResponse(error.statusCode, {
					message: "User not found",
				});
			}

			let updatedImage = user.image ?? undefined;

			// Handle image upload if present
			if (httpRequest.file) {
				const file = httpRequest.file;
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
				logger.debug(`Uploaded image to S3: ${updatedImage}`);
			}

			let updatedPassword: string | undefined =
				user.hashedPassword ?? undefined;
			if (password) {
				updatedPassword = await this.passwordHasher.hashPassword(password);
			}

			const updatedUser = this.userRepository.update({
				id: userId,
				firstName: firstName,
				lastName: lastName,
				hashedPassword: updatedPassword,
				image: updatedImage,
			});

			response = {
				success: true,
				data: updatedUser,
			};
			logger.info(`User ${userId} updated profile successfully`);
			const success = this.httpSuccess.success_200(response.data);
			return new HttpResponse(success.statusCode, success.body);
		} catch (err) {
			logger.error(`Failed to update profile for user ${userId}:`, err);
			error = this.httpErrors.error_500();
			return new HttpResponse(error.statusCode, {
				message: "Failed to update profile",
			});
		}
	}
}
