import { RequestHandler} from "express";
import { DependenciesInterface } from "../../entities/interfaces";
import TokenService from "../../helpers/TokenService";
import env from "../../env";

export = (dependencies: DependenciesInterface) => {
	const userLogin = <RequestHandler>((req, res) => {
		const { user } = req;

		if (!user) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const accessToken = TokenService.generateToken(
			user,
			env.ACCESS_TOKEN_SECRET as string
		);
		const refreshToken = TokenService.generateToken(
			user,
			env.REFRESH_TOKEN_SECRET as string
		);

		res.cookie("refreshToken", refreshToken);
		res.json({ accessToken, user, refreshToken });
	});

	return userLogin;
};
