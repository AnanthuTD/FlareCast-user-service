import { RequestHandler } from "express";
import { DependenciesInterface } from "../../entities/interfaces";

export = (dependencies: DependenciesInterface) => {
	const {
		userRepository: { userExists },
	} = dependencies.repository;

	const userExistController = <RequestHandler>(async (req, res, next) => {
		try {
			const { email } = req.query;
			if (!email) {
				return res.status(400).json({ message: "Email is required" });
			}
			const exists = await userExists(email as string);
			return res.json(exists);
		} catch (error) {
			next(error);
		}
	});

	return userExistController;
};
