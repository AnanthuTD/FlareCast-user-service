import { NextFunction, Request, RequestHandler, Response } from "express";
import { DependenciesInterface } from "../../entities/interfaces";
import prisma from "../../prismaClient";
import HttpStatusCodes from "../../common/HttpStatusCodes";

export = (dependencies: DependenciesInterface) => {
	const isAuthenticated: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const { user } = req;
		if (!user) {
			res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: "Unauthorized" });
		} else {
			const userData = await prisma.user.findUnique({
				where: { id: user.id },
				select: {
					activeSubscription: {
						select: {
							plan: true,
						},
					},
					firstName: true,
					id: true,
					image: true,
					lastName: true,
				},
			});

			res.json({
				user: {
					...user,
					plan: userData?.activeSubscription?.plan,
					...userData,
				},
			});
		}
	};

	return isAuthenticated;
};
