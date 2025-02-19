import { Inject, Service } from "typedi";
import { IValidateRefreshTokenUseCase, IRefreshTokenRepository } from "../../entities/interfaces";
import { RefreshTokenRepository } from "../../repositories/refreshToken.repository";

@Service()
export class ValidateRefreshTokenUseCase implements IValidateRefreshTokenUseCase {
  constructor(@Inject() private refreshTokenRepo: RefreshTokenRepository) {}

  async execute(token: string) {
    return !(await this.refreshTokenRepo.isTokenBlacklisted(token));
  }
}
