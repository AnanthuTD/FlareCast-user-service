import { Inject } from "typedi";
import { IBlacklistRefreshTokenUseCase } from "@/app/use-cases/auth/IBlacklistRefreshToken";
import { RefreshTokenRepository } from "@/infra/repositories/redis/RefreshToken";
import { TOKENS } from "@/app/tokens";
import { inject, injectable } from "inversify";

@injectable()
export class BlacklistRefreshTokenUseCase
	implements IBlacklistRefreshTokenUseCase
{
	constructor(
		@inject(TOKENS.RefreshTokenRepository)
		private refreshTokenRepo: RefreshTokenRepository
	) {}

	async execute(token: string, expiresAt: number): Promise<void> {
		await this.refreshTokenRepo.blacklistToken(token, expiresAt);
	}
}
