import prisma from "../prismaClient";
import { logger } from "../logger/logger";
import { Service } from "typedi";
import { User } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

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

	async incrementVideoCount(userId: string): Promise<number> {
		try {
			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: { totalVideoCount: true },
			});

			const updatedUser = await prisma.user.update({
				where: { id: userId },
				data: { totalVideoCount: (user?.totalVideoCount || 0) + 1 },
				select: { totalVideoCount: true },
			});
			return updatedUser.totalVideoCount ?? 0;
		} catch (error) {
			// Handle case where user doesn't exist
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === "P2025"
			) {
				console.warn(`User ${userId} not found for incrementVideoCount`);
				return 0; // Or throw new Error("User not found") if you prefer
			}
			throw error; // Re-throw other errors (e.g., database connection issues)
		}
	}

	// Decrement video count, ensuring it doesn't go below 0
	async decrementVideoCount(userId: string): Promise<number> {
		try {
			// First fetch the current count to check if it's > 0
			const user = await prisma.user.findUnique({
				where: { id: userId },
				select: { totalVideoCount: true },
			});

			if (!user) {
				console.warn(`User ${userId} not found for decrementVideoCount`);
				return 0; // User doesn’t exist
			}

			const currentCount = user.totalVideoCount ?? 0; // Treat null as 0
			if (currentCount <= 0) {
				return 0; // Already 0 or negative, no decrement needed
			}

			// Perform the decrement
			const updatedUser = await prisma.user.update({
				where: { id: userId },
				data: { totalVideoCount: { decrement: 1 } },
				select: { totalVideoCount: true },
			});
			return updatedUser.totalVideoCount ?? 0;
		} catch (error) {
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === "P2025"
			) {
				console.warn(`User ${userId} not found for decrementVideoCount`);
				return 0;
			}
			throw error;
		}
	}

	async getTotalUsersCount() {
		const totalUsers = await prisma.user.count();
		return totalUsers;
	}

	async getBannedUsersCount() {
		const bannedUsers = await prisma.user.count({ where: { isBanned: true } });
		return bannedUsers;
	}

	async getUsersSignedUpBetween(startDate: Date, endDate: Date) {
		const usersSignedUp = await prisma.user.count({
			where: { createdAt: { gte: startDate, lte: endDate } },
		});
		return usersSignedUp;
	}
}
