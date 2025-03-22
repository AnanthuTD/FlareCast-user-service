import { Inject } from "typedi";
import { IBlacklistRefreshTokenUseCase } from "@/app/use-cases/auth/BlacklistRefreshToken";
import { RefreshTokenRepository } from "@/infra/repositories/redis/RefreshToken";
import { TOKENS } from "@/app/tokens";

export class BlacklistRefreshTokenUseCase
	implements IBlacklistRefreshTokenUseCase
{
	constructor(
		@Inject(TOKENS.RefreshTokenRepository)
		private refreshTokenRepo: RefreshTokenRepository
	) {}

	async execute(token: string, expiresAt: number): Promise<void> {
		await this.refreshTokenRepo.blacklistToken(token, expiresAt);
	}
}
