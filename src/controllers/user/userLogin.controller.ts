import { RequestHandler } from "express";
import { DependenciesInterface } from "../../entities/interfaces";
import TokenService from "../../helpers/TokenService";
import env from "../../env";
import { sendUserVerifiedEvent } from "../../kafka/producer";
import axios from "axios";
import { User } from "@prisma/client";
import { logger } from "../../logger/logger";

export = (dependencies: DependenciesInterface) => {
	const userLogin = <RequestHandler>(async (req, res) => {
		const { user } = req;

		if (!user) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		if (!(user as User).isVerified) {
			if (!(await checkIfVerified(user as User))) {
				return res.status(401).json({ message: "User not verified" });
			}
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

const checkIfVerified = async (user: User) => {
	try {
		const { data } = await axios.get(env.EMAIL_SERVICE_URL + "/api/isVerified/" + user.id);
		if (!data.verified) return false;

		sendUserVerifiedEvent(user?.id, user?.firstName);
		return true;
	} catch (error) {
		logger.debug(error.message, "Failed to check user verified!");
		return false;
	}
};
