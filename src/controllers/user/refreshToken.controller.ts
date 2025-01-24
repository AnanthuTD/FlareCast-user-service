import { RequestHandler } from "express";
import { DependenciesInterface } from "../../entities/interfaces";
import TokenService from "../../helpers/TokenService";
import env from "../../env";

export = (dependencies: DependenciesInterface) => {
	const {
		userRepository: {
      getUserById
    },
	} = dependencies.repository;

	const refreshTokenController = <RequestHandler>(async (req, res, next) => {
		try {
		/* 	const accessToken = req.headers.authorization?.split(" ").pop();

			if(accessToken){
				
			} */

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

			res.cookie("refreshToken", newRefreshToken, { httpOnly: true });
			return res.json({ accessToken });
		} catch (error) {
			next(error);
		}
	});

	return refreshTokenController;
};
