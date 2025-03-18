import { RequestHandler } from "express";
import { DependenciesInterface } from "../../entities/interfaces";
import env from "../../env";
import { BlacklistRefreshTokenUseCase } from "../../usecases/user/blacklistRefreshToken.usecase";
import Container from "typedi";
import jwt from "jsonwebtoken";
import HttpStatusCodes from "../../common/HttpStatusCodes";

export = (dependencies: DependenciesInterface) => {
	const logoutController = <RequestHandler>(async (req, res) => {
		const blacklistRefreshTokenUseCase = Container.get(
			BlacklistRefreshTokenUseCase
		);
		const refreshToken = req.cookies["refreshToken"];
		if (!refreshToken) {
			console.warn("No refresh token found in cookies");
			// Proceed with logout even if missing, since accessToken is cleared
		} else {
			const token = refreshToken;
			const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET as string) as {
				id: string;
				type: string;
				exp?: number;
			};

			// Blacklist the refresh token
			await blacklistRefreshTokenUseCase.execute(
				refreshToken,
				decoded.exp || Date.now() / 1000 + 7 * 24 * 60 * 60
			); // Default to 7 days if exp not present
		}

		// Clear cookies
		res.clearCookie("accessToken", {
			httpOnly: true,
			secure: env.NODE_ENV === "production",
			sameSite: "strict",
		});

		res.clearCookie("refreshToken", {
			httpOnly: true,
			secure: env.NODE_ENV === "production",
			sameSite: "strict",
		});
		res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: "Logged out" });
	});

	return logoutController;
};
