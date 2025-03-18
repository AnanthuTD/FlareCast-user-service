import { NextFunction, Request, RequestHandler, Response } from "express";
import { DependenciesInterface } from "../../entities/interfaces";
import { hashPassword } from "../../helpers/hashPassword";
import TokenService from "../../helpers/TokenService";
import env from "../../env";
import { sendUserCreationEvent } from "../../kafka/producer";
import HttpStatusCodes from "../../common/HttpStatusCodes";

export = (dependencies: DependenciesInterface) => {
	const {
		userRepository: { userExists, createUser },
	} = dependencies.repository;

	const signUpController = <RequestHandler>(async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		try {
			const { email, password, firstName, lastName, image } = req.body;
			if (!email || !password || !firstName || !lastName) {
				return res.status(HttpStatusCodes.BAD_REQUEST).json({
					message: "Email, password, first name, and last name are required",
				});
			}

			const exists = await userExists(email as string);
			if (exists) {
				return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "User already exists" });
			}

			const hashedPassword = await hashPassword(password);
			const user = await createUser({
				email,
				hashedPassword,
				firstName,
				lastName,
				image,
			});

			sendUserCreationEvent(user.id, user.email);

			/* const accessToken = TokenService.generateToken(
				{ id: user.id },
				env.ACCESS_TOKEN_SECRET
			);
			const refreshToken = TokenService.generateToken(
				{ id: user.id },
				env.REFRESH_TOKEN_SECRET
			); */

			/* res.cookie("refreshToken", refreshToken, { httpOnly: true });
			res
				.status(HttpStatusCodes.CREATED)
				.json({ message: "User created", accessToken, refreshToken }); */

				res.status(HttpStatusCodes.CREATED).json({ message: "Verify the email to continue!"});

		} catch (error) {
			next(error);
		}
	});

	return signUpController;
};
