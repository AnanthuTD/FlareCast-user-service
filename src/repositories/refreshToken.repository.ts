import { Service } from "typedi";
import redis from "../config/redis";
import { IRefreshTokenRepository } from "../entities/interfaces";
import { logger } from "../logger/logger";

@Service()
export class RefreshTokenRepository implements IRefreshTokenRepository {
	private blacklistPrefix = "blacklist:";

	async blacklistToken(token: string, expiresAt: number): Promise<void> {
    const expiresAtMs = expiresAt * 1000;
    const ttl = expiresAtMs - Date.now();

		if (ttl <= 0) {
			logger.warn(
				`Attempted to blacklist token ${token}, but it's already expired.`
			);
			return;
		}

		logger.debug(`Blacklisting token ${token} for ${ttl / 1000} seconds`);

		await redis.set(`${this.blacklistPrefix}${token}`, "blacklisted", {
			EX: Math.floor(ttl / 1000), // Convert milliseconds to seconds
		});
	}

	async isTokenBlacklisted(token: string): Promise<boolean> {
		const result = await redis.get(`${this.blacklistPrefix}${token}`);
		logger.debug(`isTokenBlacklisted ${result} from redis`);
		return result === null;
	}
}
