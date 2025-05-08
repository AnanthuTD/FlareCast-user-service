/**
 * Interface for the repository handling refresh tokens.
 *
 * @interface
 */
export interface IRefreshTokenRepository {
	blacklistToken(token: string, expiresAt: number): Promise<void>;
	isTokenBlacklisted(token: string): Promise<boolean>;
}
