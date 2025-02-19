import { Inject, Service } from "typedi";
import { IBlacklistRefreshTokenUseCase, IRefreshTokenRepository } from "../../entities/interfaces";
import { RefreshTokenRepository } from "../../repositories/refreshToken.repository";

@Service()
export class BlacklistRefreshTokenUseCase implements IBlacklistRefreshTokenUseCase {
  constructor(@Inject() private refreshTokenRepo: RefreshTokenRepository) {}

  async execute(token: string, expiresAt: number): Promise<void> {
    await this.refreshTokenRepo.blacklistToken(token, expiresAt);
  }
}