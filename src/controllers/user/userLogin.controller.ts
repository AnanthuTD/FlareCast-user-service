import { RequestHandler } from "express";
import { DependenciesInterface } from "../../entities/interfaces";
import TokenService from "../../helpers/TokenService";
import env from "../../env";
import axios from "axios";
import { User } from "@prisma/client";
import { logger } from "../../logger/logger";
import { handleVerifiedUserEvent } from "../../kafka/handlers/verifiedUserEvent.handler";
import HttpStatusCodes from "../../common/HttpStatusCodes";

export = (dependencies: DependenciesInterface) => {
	const userLogin = <RequestHandler>(async (req, res) => {
		const { user } = req;

		if (!user) {
			return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Invalid credentials" });
		}

		if ((user as User).isBanned) {
			return res.status(HttpStatusCodes.FORBIDDEN).json({ message: "User is banned" });
		}

		if (!(user as User).isVerified) {
			if (!(await checkIfVerified(user as User))) {
				return res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: "User not verified" });
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
		res.cookie("accessToken", accessToken);

		res.json({ accessToken, user, refreshToken });
	});

	return userLogin;
};

const checkIfVerified = async (user: User) => {
	console.debug("Checking if user is: ", user);

	try {
		const { data } = await axios.get(
			env.EMAIL_SERVICE_URL + "/api/isVerified/" + user.id
		);
		if (!data.verified) return false;

		handleVerifiedUserEvent({ userId: user.id, email: user.email });
		return true;
	} catch (error) {
		logger.debug(error.message, "Failed to check user verified!");
		return false;
	}
};
