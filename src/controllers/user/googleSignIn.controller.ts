import { NextFunction, Request, RequestHandler, Response } from "express";
import { DependenciesInterface } from "../../entities/interfaces";
import axios from "axios";
import TokenService from "../../helpers/TokenService";
import env from "../../env";
import { authResponseUserObject } from "../../dto/user.dto";
import { sendUserVerifiedEvent } from "../../kafka/producer";

export = (dependencies: DependenciesInterface) => {
	const {
		userRepository: { getUserByEmail, createUser },
	} = dependencies.repository;

	const googleSignInController = <RequestHandler>(async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const { code } = req.body;
			if (!code) {
				return res
					.status(400)
					.json({ error: "Authorization code is required." });
			}

			const data = await axios.get(
				`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${code.access_token}`,
				{
					headers: {
						Authorization: `Bearer ${code.access_token}`,
						Accept: "application/json",
					},
				}
			);

			if (!data || !data.data) {
				return res
					.status(400)
					.json({ message: "Failed to authenticate with Google." });
			}

			const payload = data.data;

			let user = await getUserByEmail(payload.email);
			if (!user) {
				user = await createUser({
					email: payload.email,
					firstName: payload.given_name,
					lastName: payload.family_name,
					image: payload.picture,
					isVerified: true,
				});
				sendUserVerifiedEvent(user.id, user.firstName)
			}


			const accessToken = TokenService.generateToken(
				{ id: user.id },
				env.ACCESS_TOKEN_SECRET
			);
			const refreshToken = TokenService.generateToken(
				{ id: user.id },
				env.REFRESH_TOKEN_SECRET
			);

			res.cookie("refreshToken", refreshToken, { httpOnly: true });
			return res.status(200).json({
				message: "Successfully authenticated.",
				user: authResponseUserObject(user),
				accessToken,
			});
		} catch (error) {
			next(error);
		}
	});

	return googleSignInController;
};
