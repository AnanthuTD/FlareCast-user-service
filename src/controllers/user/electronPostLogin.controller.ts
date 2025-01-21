import { RequestHandler } from "express";
import { DependenciesInterface } from "../../entities/interfaces";
import TokenService from "../../helpers/TokenService";
import env from "../../env";
import { authResponseUserObject } from "../../dto/user.dto";

export = (dependencies: DependenciesInterface) => {
	const {
		userRepository: { getUserById },
	} = dependencies.repository;

	const postLogin = <RequestHandler>(async (req, res, next) => {
		/* console.log(
			"=================================Refreshing token by electron================================="
		); */
		const refreshToken = req.body.refreshToken;
		if (!refreshToken) {
			console.log("No refresh token");
			return res.status(401).json({ message: "Unauthorized" });
		}

		try {
			const payload = TokenService.verifyToken(
				refreshToken,
				env.REFRESH_TOKEN_SECRET as string
			);
			if (!payload.valid || !payload.id) {
				console.log("Invalid refresh token", payload);
				return res.status(401).json({ message: payload.message });
			}

			const user = await getUserById(payload.id);
			if (!user) {
				console.log("User not found");
				return res
					.status(401)
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
			return res.json({
				user: { accessToken, ...authResponseUserObject(user) },
			});
		} catch (error) {
			console.error("Error during token refresh:", error);
			res.status(401).json({ message: "Unauthorized" });
			next(error);
		} finally {
		/* 	console.log(
				"=================================End of Refreshing token================================="
			); */
		}
	});

	return postLogin;
};
