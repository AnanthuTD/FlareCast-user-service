/**
 * Interface for the provider responsible for generating refresh tokens.
 *
 * @interface
 */
export interface IGenerateAccessTokenProvider {
	/**
	 * Generates a new access token based on the provided token.
	 *
	 * @async
	 * @param {string} token - The token used as a basis for generating the refresh token.
	 * @returns {Promise<string>} The generated refresh token.
	 */
	generateToken(token: { id: string; [key: string]: any }): Promise<string>;
}
