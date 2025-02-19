import { RequestHandler } from "express";
import { Inject, Service, Container } from "typedi";
import { DependenciesInterface } from "../../entities/interfaces";
import TokenService from "../../helpers/TokenService";
import env from "../../env";
import { BlacklistRefreshTokenUseCase } from "../../usecases/user/blacklistRefreshToken.usecase";
import { ValidateRefreshTokenUseCase } from "../../usecases/user/validateRefreshToken.usecase";
import { getUserById } from "../../repositories/userRepository";
import { logger } from "../../logger/logger";

@Service()
export class RefreshTokenController {
	constructor(
		@Inject(() => BlacklistRefreshTokenUseCase)
		private blacklistRefreshTokenUseCase: BlacklistRefreshTokenUseCase, 

		@Inject(() => ValidateRefreshTokenUseCase)
		private validateRefreshTokenUseCase: ValidateRefreshTokenUseCase
	) {}

	handler: RequestHandler = async (req, res, next) => {
		try {
			const { refreshToken } = req.cookies;
			if (!refreshToken) {
				return res.status(401).json({ message: "Unauthorized" });
			}

			const payload = TokenService.verifyToken(
				refreshToken,
				env.REFRESH_TOKEN_SECRET
			);
			if (!payload.valid || !payload.id) {
				return res.status(401).json({ message: "Invalid refresh token" });
			}

			const isRefreshTokenBlacklisted =
				await this.validateRefreshTokenUseCase.execute(
					refreshToken as string
				);

			if (isRefreshTokenBlacklisted) {
				logger.debug(`Refresh token ${refreshToken} blacklisted`)
				return res
					.status(401)
					.json({ message: "Refresh token has been blacklisted" });
			}

			logger.debug(`Refresh token expiration ${payload.decoded?.exp}`)

			await this.blacklistRefreshTokenUseCase.execute(
				refreshToken as string,
				payload.decoded?.exp as number
			);

			logger.debug(`Old refresh token ${refreshToken}`)

			const user = await getUserById(payload.id);
			if (!user) {
				return res.status(401).json({ message: "User not found" });
			}

			const accessToken = TokenService.generateToken(
				{ id: user.id },
				env.ACCESS_TOKEN_SECRET
			);
			const newRefreshToken = TokenService.generateToken(
				{ id: user.id },
				env.REFRESH_TOKEN_SECRET
			);

			logger.debug(`New refresh token ${newRefreshToken}`)

			res.cookie("refreshToken", newRefreshToken, { httpOnly: true });
			return res.json({ accessToken });
		} catch (error) {
			next(error);
		}
	};
}

export default Container.get(RefreshTokenController).handler;
