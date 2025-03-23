import { IRefreshTokenRepository } from "@/app/repositories/IRefreshTokenRepository";
import { Inject } from "typedi";
import { logger } from "@/infra/logger";
import { RedisClientType } from "redis";
import { TOKENS } from "@/app/tokens";
import { inject, injectable } from "inversify";

/**
 * Prisma implementation of the refresh token repository.
 *
 * @class
 * @implements {IRefreshTokenRepository}
 */
@injectable()
export class RefreshTokenRepository implements IRefreshTokenRepository {
	/**
	 * Creates an instance of RefreshTokenPrismaRepository.
	 *
	 * @constructor
	 * @param {PrismaClient} prisma - The Prisma client instance.
	 */
	constructor(
		@inject(TOKENS.RedisClient) private readonly redis: RedisClientType,
	) {}

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

		await this.redis.set(`${this.blacklistPrefix}${token}`, "blacklisted", {
			EX: Math.floor(ttl / 1000),
		});
	}

	async isTokenBlacklisted(token: string): Promise<boolean> {
		const result = await this.redis.get(`${this.blacklistPrefix}${token}`);
		logger.debug(`isTokenBlacklisted ${result} from redis`);
		return result === null;
	}
}
