import { sign } from "jsonwebtoken";
import { IGenerateAccessTokenProvider } from "@/app/providers/IGenerateAccessToken";
import env from "@/infra/env";
import { injectable } from "inversify";

/**
 * Implementation of the Access token generation provider.
 *
 * @class
 * @implements {IGenerateAccessTokenProvider}
 */
@injectable()
export class GenerateAccessTokenProvider
	implements IGenerateAccessTokenProvider
{
	/**
	 * Generates a new Access token based on the provided token.
	 *
	 * @async
	 * @param {string} token - The token to use as a basis for the Access token.
	 * @returns {Promise<string>} The generated Access token.
	 * @throws {Error} Throws an error if the ACCESS_TOKEN_SECRET is missing in the environment variables.
	 */
	async generateToken(token: {
		id: string;
		[key: string]: any;
	}): Promise<string> {
		const secretKey = env.ACCESS_TOKEN_SECRET;

		if (!secretKey) {
			throw new Error(
				"ACCESS_TOKEN_SECRET is missing in the environment variables."
			);
		}

		const generatedToken = sign(token, secretKey, {
			subject: token.id,
			expiresIn: "15m",
		});

		return generatedToken;
	}
}
