import prisma from "../prismaClient";
import { logger } from "../logger/logger";
import { Service } from "typedi";
import { User } from "@prisma/client";

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
			isVerified,
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

@Service()
export class UserRepository {
	async findPaginatedUsers({
		page = 1,
		limit = 10,
		searchQuery = "",
		includeBanned = false,
	}: {
		page?: number;
		limit?: number;
		searchQuery?: string;
		includeBanned?: boolean;
	}) {
		const skip = (page - 1) * limit;

		const pipeline: any[] = [];

		// Normal search with $regex if searchQuery is provided
		if (searchQuery) {
			pipeline.push({
				$match: {
					$or: [
						{ email: { $regex: searchQuery, $options: "i" } },
						{ firstName: { $regex: searchQuery, $options: "i" } },
						{ lastName: { $regex: searchQuery, $options: "i" } },
					],
				},
			});
		}

		// Filter out banned users unless includeBanned is true
		if (includeBanned) {
			pipeline.push({
				$match: {
					$or: [{ isBanned: true }],
				},
			});
		}

		// Add sorting and pagination
		pipeline.push(
			{ $sort: { createdAt: -1 } },
			{ $skip: skip },
			{ $limit: limit },
			{
				$project: {
					id: { $toString: "$_id" },
					email: 1,
					firstName: 1,
					lastName: 1,
					image: 1,
					isBanned: 1,
				},
			}
		);

		// Execute pipeline for users
		const usersResult = await prisma.$runCommandRaw({
			aggregate: "User",
			pipeline,
			cursor: {},
		});

		// Calculate total count (remove skip and limit, add count)
		const totalPipeline = [...pipeline.slice(0, -2), { $count: "total" }];
		const totalResult = await prisma.$runCommandRaw({
			aggregate: "User",
			pipeline: totalPipeline,
			cursor: {},
		});

		const users = usersResult.cursor.firstBatch;
		const total = totalResult.cursor.firstBatch[0]?.total || 0;

		return {
			users,
			total,
			totalPages: Math.ceil(total / limit),
			currentPage: page,
		};
	}

	async updateUserBanStatus(id: string, isBanned: boolean): Promise<User> {
		return await prisma.user.update({
			where: { id },
			data: { isBanned },
		});
	}

	async canSubscribe(id: string): Promise<{
		canSubscribe: boolean;
		message?: string;
		code?: string;
	}> {
		const user = await this.getUserById(id);
		if (!user) {
			return {
				canSubscribe: false,
				message: "User not found!",
				code: "USER_NOT_FOUND",
			};
		}
		if (!user?.isVerified) {
			return {
				canSubscribe: false,
				message: "User is not verified!",
				code: "USER_NOT_VERIFIED",
			};
		}

		if (user.isBanned) {
			return {
				canSubscribe: false,
				message: "User is banned!",
				code: "USER_BANNED",
			};
		}

		return { canSubscribe: true, message: "User can subscribe" };
	}

	async userExists(email: string) {
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

	async createUser({
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
				isVerified,
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

	async getUserByEmail(email: string) {
		const user = await prisma.user.findFirst({
			where: {
				email,
			},
		});
		return user;
	}

	async getUserById(id: string) {
		const user = await prisma.user.findFirst({
			where: {
				id,
			},
		});
		return user;
	}

	async markAsVerified(userId: string, email: string) {
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

	async currentVideoCount(userId: string) {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { totalVideoCount: true },
		});
		return user?.totalVideoCount || 0;
	}

	async incrementVideoCount(userId: string) {
		const user = await prisma.user.update({
			where: { id: userId },
			data: { totalVideoCount: { increment: 1 } },
		});
		return user?.totalVideoCount || 0;
	}

	async decrementVideoCount(userId: string) {
		const user = await prisma.user.update({
			where: { id: userId },
			data: { totalVideoCount: { decrement: 1 } },
		});
		return user?.totalVideoCount || 0;
	}
}
