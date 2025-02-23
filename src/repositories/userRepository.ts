import prisma from "../prismaClient";
import { logger } from "../logger/logger";

export async function userExists(email: string) {
	const user = await prisma.user.findFirst({
		where: { email },
		select: { id: true, hashedPassword: true },
	});
	logger.info(user);
	if (user?.hashedPassword) {
		return { method: "credential" };
	} else if (user) {
		return { method: "google" };
	}

	return null;
}

export async function createUser({
	email,
	hashedPassword,
	firstName,
	lastName,
	image,
	isVerified = false,
}: {
	email: string;
	hashedPassword?: string;
	firstName: string;
	lastName: string;
	image?: string;
	isVerified: boolean;
}) {
	const user = await prisma.user.create({
		data: {
			email,
			hashedPassword,
			firstName,
			lastName,
			image,
			isVerified
		},
		select: {
			id: true,
			email: true,
			firstName: true,
			lastName: true,
			image: true,
		},
	});

	return user;
}

export async function getUserByEmail(email: string) {
	const user = await prisma.user.findFirst({
		where: {
			email,
		},
	});
	return user;
}

export async function getUserById(id: string) {
	const user = await prisma.user.findFirst({
		where: {
			id,
		},
	});
	return user;
}

export async function markAsVerified(userId: string, email: string) {
	try {
		return prisma.user.update({
			where: { id: userId, email, isVerified: false },
			data: { isVerified: true },
		});
	} catch (error) {
		logger.error("Error marking user as verified", error);
		return null;
	}
}
