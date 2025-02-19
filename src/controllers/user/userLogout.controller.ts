import { RequestHandler } from "express";
import { DependenciesInterface } from "../../entities/interfaces";

export = (dependencies: DependenciesInterface) => {
	const logoutController = <RequestHandler>((req, res) => {
		res.clearCookie("refreshToken");
		res.status(401).json({ message: "Logged out" });
	});

	return logoutController;
};
