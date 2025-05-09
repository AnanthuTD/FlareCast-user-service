import { RequestHandler } from "express";
import { DependenciesInterface } from "../../entities/interfaces";
import TokenService from "../../helpers/TokenService";
import env from "../../env";
import { authResponseUserObject } from "../../dto/user.dto";
import { logger } from "../../logger/logger";
import HttpStatusCodes from "../../common/HttpStatusCodes";

export = (dependencies: DependenciesInterface) => {
	const {
		userRepository: { getUserById },
	} = dependencies.repository;

	const postLogin = <RequestHandler>(async (req, res, next) => {
		/* logger.info(
			"=================================Refreshing token by electron================================="
		); */
		const refreshToken = req.body.refreshToken;
		if (!refreshToken) {
			logger.info("No refresh token");
			return res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
		}

		try {
			const payload = TokenService.verifyToken(
				refreshToken,
				env.REFRESH_TOKEN_SECRET as string
			);
			if (!payload.valid || !payload.id) {
				logger.info("Invalid refresh token", payload);
				return res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: payload.message });
			}

			const user = await getUserById(payload.id);
			if (!user) {
				logger.info("User not found");
				return res
					.status(HttpStatusCodes.UNAUTHORIZED)
					.json({ message: payload.message || "Unauthorized" });
			}

			// TODO: Only storing the user id in the token for now
			const accessToken = TokenService.generateToken(
				{ id: user.id },
				env.ACCESS_TOKEN_SECRET as string
			);
			const newRefreshToken = TokenService.generateToken(
				{ id: user.id },
				env.REFRESH_TOKEN_SECRET as string
			);

			res.cookie("refreshToken", newRefreshToken);
			res.cookie("accessToken", accessToken);
			
			return res.json({
				user: { accessToken, ...authResponseUserObject(user) },
			});
		} catch (error) {
			logger.error("Error during token refresh:", error);
			res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
			next(error);
		} finally {
		/* 	logger.info(
				"=================================End of Refreshing token================================="
			); */
		}
	});

	return postLogin;
};
