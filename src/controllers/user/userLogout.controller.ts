import { RequestHandler } from "express";
import { DependenciesInterface } from "../../entities/interfaces";

export = (dependencies: DependenciesInterface) => {
	const logoutController = <RequestHandler>((req, res) => {
		res.clearCookie("refreshToken");
		res.status(200).json({ message: "Logged out" });
	});

	return logoutController;
};
