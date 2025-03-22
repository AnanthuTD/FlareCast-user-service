import { sign } from "jsonwebtoken";
import { IGenerateRefreshTokenProvider } from "../../app/providers/IGenerateRefreshToken";
import env from "@/infra/env";

/**
 * Implementation of the refresh token generation provider.
 *
 * @class
 * @implements {IGenerateRefreshTokenProvider}
 */
export class GenerateRefreshTokenProvider
	implements IGenerateRefreshTokenProvider
{
	/**
	 * Generates a new refresh token based on the provided token.
	 *
	 * @async
	 * @param {string} token - The token to use as a basis for the refresh token.
	 * @returns {Promise<string>} The generated refresh token.
	 * @throws {Error} Throws an error if the REFRESH_TOKEN_SECRET is missing in the environment variables.
	 */
	async generateToken(token: {
		id: string;
		[key: string]: any;
	}): Promise<string> {
		const secretKey = env.REFRESH_TOKEN_SECRET;

		if (!secretKey) {
			throw new Error(
				"REFRESH_TOKEN_SECRET is missing in the environment variables."
			);
		}

		const generatedToken = sign(token, secretKey, {
			subject: token.id,
			expiresIn: "30d",
		});

		return generatedToken;
	}
}
