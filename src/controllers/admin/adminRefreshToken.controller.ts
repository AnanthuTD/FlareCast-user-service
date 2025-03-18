import { RequestHandler } from "express";
import { Inject, Service } from "typedi";
import TokenService from "../../helpers/TokenService";
import env from "../../env";
import { BlacklistRefreshTokenUseCase } from "../../usecases/user/blacklistRefreshToken.usecase";
import { ValidateRefreshTokenUseCase } from "../../usecases/user/validateRefreshToken.usecase";
import { logger } from "../../logger/logger";
import prisma from "../../prismaClient";
import HttpStatusCodes from "../../common/HttpStatusCodes";

@Service()
export class AdminRefreshTokenController {
	constructor(
		@Inject(() => BlacklistRefreshTokenUseCase)
		private blacklistRefreshTokenUseCase: BlacklistRefreshTokenUseCase,

		@Inject(() => ValidateRefreshTokenUseCase)
		private validateRefreshTokenUseCase: ValidateRefreshTokenUseCase
	) {}

	handler: RequestHandler = async (req, res, next) => {
		try {
			// Extract tokens from cookies
			const { accessToken, refreshToken } = req.cookies;

			// Check if accessToken exists
			if (!accessToken) {
				logger.debug("No access token found in cookies");
				res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: "Access token not found" });
				return;
			}

			// Check if refreshToken exists
			if (!refreshToken) {
				logger.debug("No refresh token found in cookies");
				return res
					.status(HttpStatusCodes.UNAUTHORIZED)
					.json({ message: "Unauthorized - No refresh token" });
			}

			// Verify accessToken (if it exists) to check expiration
			let isAccessTokenExpired = true;
			if (accessToken) {
				const accessTokenPayload = TokenService.verifyToken(
					accessToken,
					env.ACCESS_TOKEN_SECRET
				);
				if (accessTokenPayload.valid && accessTokenPayload.decoded?.exp) {
					const currentTime = Math.floor(Date.now() / 1000);
					isAccessTokenExpired = currentTime > accessTokenPayload.decoded.exp;
					if (!isAccessTokenExpired) {
						logger.debug("Access token is still valid");
						return res
							.status(HttpStatusCodes.OK)
							.json({ accessToken, message: "Access token is still valid" });
					}
				} else {
					logger.debug("Access token is invalid or malformed");
				}
			}

			// Verify refreshToken
			const refreshTokenPayload = TokenService.verifyToken(
				refreshToken,
				env.REFRESH_TOKEN_SECRET
			);
			if (!refreshTokenPayload.valid || !refreshTokenPayload.id) {
				logger.debug("Invalid refresh token");
				return res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: "Invalid refresh token" });
			}

			// Check if refreshToken is blacklisted
			const isRefreshTokenBlacklisted =
				await this.validateRefreshTokenUseCase.execute(refreshToken);
			if (isRefreshTokenBlacklisted) {
				logger.debug(`Refresh token ${refreshToken} blacklisted`);
				return res
					.status(HttpStatusCodes.UNAUTHORIZED)
					.json({ message: "Refresh token has been blacklisted" });
			}

			// Blacklist the old refreshToken
			logger.debug(
				`Refresh token expiration ${refreshTokenPayload.decoded?.exp}`
			);
			await this.blacklistRefreshTokenUseCase.execute(
				refreshToken,
				refreshTokenPayload.decoded?.exp as number
			);

			logger.debug(`Old refresh token ${refreshToken}`);

			// Get user by ID
			const user = await prisma.admin.findUnique({
				where: { id: refreshToken.id },
			});
			if (!user) {
				logger.debug(`User with ID ${refreshTokenPayload.id} not found`);
				return res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: "User not found" });
			}

			// Generate new tokens
			const newAccessToken = TokenService.generateToken(
				{ id: user.id },
				env.ACCESS_TOKEN_SECRET
			);
			const newRefreshToken = TokenService.generateToken(
				{ id: user.id },
				env.REFRESH_TOKEN_SECRET
			);

			logger.debug(`New refresh token ${newRefreshToken}`);

			// Set new cookies
			res.cookie("accessToken", newAccessToken, {
				secure: env.NODE_ENV === "production",
				sameSite: "strict",
				// maxAge: 15 * 60 * 1000, // 15 minutes
			});
			res.cookie("refreshToken", newRefreshToken, {
				httpOnly: true,
				secure: env.NODE_ENV === "production",
				sameSite: "strict",
				maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
			});

			// Respond with new accessToken
			return res.json({ accessToken: newAccessToken });
		} catch (error) {
			logger.error("Refresh token error:", error);
			next(error);
		}
	};
}
