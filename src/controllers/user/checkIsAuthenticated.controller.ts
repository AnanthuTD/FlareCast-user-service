import { NextFunction, Request, RequestHandler, Response } from "express";
import { DependenciesInterface } from "../../entities/interfaces";
import prisma from "../../prismaClient";
import HttpStatusCodes from "../../common/HttpStatusCodes";
import { UserSubscriptionRepository } from "../../repositories/userSubscription.repository";
import Container from "typedi";

export = (dependencies: DependenciesInterface) => {
	const isAuthenticated: RequestHandler = async (
		req: Request,
		res: Response,
		next: NextFunction
	) => {
		const { user } = req;
		if (!user) {
			res
				.status(HttpStatusCodes.UNAUTHORIZED)
				.json({ message: "Unauthorized" });
		} else {
			const userData = await prisma.user.findUnique({
				where: { id: user.id },
				select: {
					firstName: true,
					id: true,
					image: true,
					lastName: true,
				},
			});

			const activeSubscription = await Container.get(
				UserSubscriptionRepository
			).getActiveSubscription(user.id);

			res.json({
				user: {
					...user,
					plan: activeSubscription,
					...userData,
				},
			});
		}
	};

	return isAuthenticated;
};
