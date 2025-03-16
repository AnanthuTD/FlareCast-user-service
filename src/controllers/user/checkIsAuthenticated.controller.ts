import { NextFunction, Request, RequestHandler, Response } from "express";
import { DependenciesInterface } from "../../entities/interfaces";
import prisma from "../../prismaClient";

export = (dependencies: DependenciesInterface) => {
	const isAuthenticated: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const { user } = req;
		if (!user) {
			res.status(401).json({ message: "Unauthorized" });
		} else {
			const userData = await prisma.user.findUnique({
				where: { id: user.id },
				select: {
					activeSubscription: {
						select: {
							plan: true,
						},
					},
				},
			});

			res.json({ user: { ...user, plan: userData?.activeSubscription?.plan } });
		}
	};

	return isAuthenticated;
};
