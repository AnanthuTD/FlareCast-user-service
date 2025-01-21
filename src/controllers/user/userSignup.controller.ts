import { NextFunction, Request, RequestHandler, Response } from "express";
import { DependenciesInterface } from "../../entities/interfaces";
import { hashPassword } from "../../helpers/hashPassword";
import TokenService from "../../helpers/TokenService";
import env from "../../env";

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
				return res.status(400).json({
					message: "Email, password, first name, and last name are required",
				});
			}

			const exists = await userExists(email as string);
			if (exists) {
				return res.status(400).json({ message: "User already exists" });
			}

			const hashedPassword = await hashPassword(password);
			const user = await createUser({
				email,
				hashedPassword,
				firstName,
				lastName,
				image,
			});

			const accessToken = TokenService.generateToken(
				{ id: user.id },
				env.ACCESS_TOKEN_SECRET
			);
			const refreshToken = TokenService.generateToken(
				{ id: user.id },
				env.REFRESH_TOKEN_SECRET
			);

			res.cookie("refreshToken", refreshToken, { httpOnly: true });
			return res
				.status(201)
				.json({ message: "User created", accessToken, refreshToken });
		} catch (error) {
			next(error);
		}
	});

	return signUpController;
};
