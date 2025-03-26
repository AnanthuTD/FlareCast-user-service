import { Request, Response, NextFunction, RequestHandler } from "express";
import { Service } from "typedi";
import axios from "axios";
import { authResponseUserObject } from "../../dto/user.dto";
import { sendUserVerifiedEvent } from "../../kafka/producer";
import TokenService from "../../helpers/TokenService";
import env from "../../env";
import { AdminRepository } from "../../repositories/adminRepository";
import { createUser, getUserByEmail } from "../../repositories/userRepository";
import HttpStatusCodes from "../../common/HttpStatusCodes";

// Define entity types
type EntityType = "user" | "admin";

// Generic interface for repository methods
interface AuthRepository<T> {
	getByEmail(email: string): Promise<T | null>;
	create(data: {
		email: string;
		firstName: string;
		lastName?: string;
		image?: string;
		isVerified?: boolean;
	}): Promise<T>;
}

@Service()
@injectable()
export class GoogleSignInController<T> {
	private readonly entityType: EntityType;

	constructor(private repository: AuthRepository<T>, entityType: EntityType) {
		this.repository = repository;
		this.entityType = entityType;
	}

	// Generic authentication handler
	private async authenticateEntity(
		payload: {
			email: string;
			given_name: string;
			family_name?: string;
			picture?: string;
		},
		isUserSpecific?: (entity) => void
	) {
		let entity = await this.repository.getByEmail(payload.email);
		if (!entity) {
			entity = await this.repository.create({
				email: payload.email,
				firstName: payload.given_name,
				lastName: payload.family_name,
				image: payload.picture,
				isVerified: true,
			});

			if (isUserSpecific) {
				isUserSpecific(entity);
			}
		}
		return entity;
	}

	// Format response data generically
	private formatResponseData(entity: T) {
		return this.entityType === "user"
			? authResponseUserObject(entity as any)
			: {
					id: (entity as any).id,
					email: (entity as any).email,
					firstName: (entity as any).firstName,
					lastName: (entity as any).lastName,
					image: (entity as any).image,
			  };
	}

	handler: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const { code } = req.body;
			if (!code || !code.access_token) {
				return res
					.status(HttpStatusCodes.BAD_REQUEST)
					.json({ error: "Authorization code is required." });
			}

			const { data } = await axios.get(
				`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${code.access_token}`,
				{
					headers: {
						Authorization: `Bearer ${code.access_token}`,
						Accept: "application/json",
					},
				}
			);

			if (!data) {
				return res
					.status(HttpStatusCodes.BAD_REQUEST)
					.json({ message: "Failed to authenticate with Google." });
			}

			const payload = data;

			const entity = await this.authenticateEntity(
				payload,
				this.entityType === "user"
					? (user) =>
							sendUserVerifiedEvent({
								userId: (user as any).id,
								firstName: (user as any).firstName,
								lastName: (user as any).lastName ?? "",
								email: (user as any).email,
								image: (user as any).image ?? "",
							})
					: undefined
			);

			const tokenPayload = { id: entity.id, type: this.entityType };
			const accessToken = TokenService.generateToken(
				tokenPayload,
				env.ACCESS_TOKEN_SECRET
			);
			const refreshToken = TokenService.generateToken(
				tokenPayload,
				env.REFRESH_TOKEN_SECRET
			);

			res.cookie("refreshToken", refreshToken, {
				secure: env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60 * 1000,
			});
			res.cookie("accessToken", accessToken, {
				secure: env.NODE_ENV === "production",
				sameSite: "strict",
				// maxAge: 15 * 60 * 1000,
			});

			const responseData = {
				message: "Successfully authenticated.",
				[this.entityType]: this.formatResponseData(entity),
				accessToken,
			};

			return res.status(HttpStatusCodes.OK).json(responseData);
		} catch (error) {
			console.error(error);
			return res
				.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
				.json({ error: "Failed to authenticate with Google." });
		}
	};
}

// Factory functions to create handlers with specific repositories
export const createUserGoogleSignInHandler = () => {
	const controller = new GoogleSignInController(
		{ create: createUser, getByEmail: getUserByEmail },
		"user"
	);
	return controller.handler;
};

export const createAdminGoogleSignInHandler = () => {
	const controller = new GoogleSignInController(new AdminRepository(), "admin");
	return controller.handler;
};

// Export default handler (optional, pick one as default)
export default createUserGoogleSignInHandler();
