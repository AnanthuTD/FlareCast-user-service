import { NextFunction, Request, Response } from "express";
import { DependenciesInterface } from "../../entities/interfaces";

export = (dependencies: DependenciesInterface) => {
	const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
		const { user } = req;
		if (!user) {
			res.status(401).json({ message: "Unauthorized" });
		} else res.json({ user });
	};

	return isAuthenticated;  
};
