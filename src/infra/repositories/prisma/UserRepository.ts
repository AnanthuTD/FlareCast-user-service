import { PrismaClient, User as PrismaUser } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { Inject, Service } from "typedi";
import {
	IUsersRepository,
	PaginatedUsersResult,
	CanSubscribeResult,
} from "@/app/repositories/IUsersRepository";
import { User } from "@/domain/entities/User";
import { Email } from "@/domain/valueObjects/email";
import { logger } from "@/infra/logger";
import { TOKENS } from "@/app/tokens";
import { inject, injectable } from "inversify";

@injectable()
export class UserRepository implements IUsersRepository {
	constructor(@inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient) {}

	private mapToDomain(user: PrismaUser): User {
		return User.create({
			id: user.id,
			email: new Email(user.email),
			firstName: user.firstName,
			lastName: user.lastName ?? null,
			hashedPassword: user.hashedPassword ?? null,
			isVerified: user.isVerified,
			isBanned: user.isBanned,
			image: user.image ?? null,
		});
	}

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
	}): Promise<PaginatedUsersResult> {
		const skip = (page - 1) * limit;

		const pipeline: any[] = [];

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

		if (includeBanned) {
			pipeline.push({
				$match: {
					$or: [{ isBanned: true }],
				},
			});
		}

		pipeline.push(
			{ $sort: { createdAt: -1 } },
			{ $skip: skip },
			{ $limit: limit }
		);

		const usersResult = await this.prisma.$runCommandRaw({
			aggregate: "User",
			pipeline,
			cursor: {},
		});

		const totalPipeline = [...pipeline.slice(0, -2), { $count: "total" }];
		const totalResult = await this.prisma.$runCommandRaw({
			aggregate: "User",
			pipeline: totalPipeline,
			cursor: {},
		});

		const rawUsers = usersResult.cursor.firstBatch as PrismaUser[];
		const users = rawUsers.map(this.mapToDomain);
		const total = totalResult.cursor.firstBatch[0]?.total || 0;

		return {
			users,
			total,
			totalPages: Math.ceil(total / limit),
			currentPage: page,
		};
	}

	async updateUserBanStatus(id: string, isBanned: boolean): Promise<User> {
		try {
			const updated = await this.prisma.user.update({
				where: { id },
				data: { isBanned },
			});
			return this.mapToDomain(updated);
		} catch (error) {
			logger.error(`Failed to update ban status for user ${id}:`, error);
			throw error;
		}
	}

	async update(data: {
		id: string;
		firstName?: string;
		lastName?: string;
		hashedPassword?: string;
		image?: string;
	}): Promise<User | null> {
		try {
			const updated = await this.prisma.user.update({
				where: { id: data.id },
				data: {
					...(data.firstName ? { firstName: data.firstName } : {}),
					...(data.lastName ? { lastName: data.lastName } : {}),
					...(data.hashedPassword
						? { hashedPassword: data.hashedPassword }
						: {}),
					...(data.image ? { image: data.image } : {}),
				},
			});

			return this.mapToDomain(updated);
		} catch (err) {
			logger.error(`Failed to update user with id ${data.id}:`, err);
			throw err;
		}
	}

	async canSubscribe(id: string): Promise<CanSubscribeResult> {
		const user = await this.findById(id);
		if (!user) {
			return {
				canSubscribe: false,
				message: "User not found!",
				code: "USER_NOT_FOUND",
			};
		}
		if (!user.isVerified) {
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

	async userExists(
		email: string
	): Promise<{ method: "credential" | "google" } | null> {
		try {
			const user = await this.prisma.user.findFirst({
				where: { email },
				select: { id: true, hashedPassword: true },
			});
			if (!user) return null;
			return user.hashedPassword
				? { method: "credential" }
				: { method: "google" };
		} catch (error) {
			logger.error(
				`Failed to check if user exists with email ${email}:`,
				error
			);
			throw error;
		}
	}

	async create({
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
	}): Promise<User> {
		try {
			const created = await this.prisma.user.create({
				data: {
					email,
					hashedPassword,
					firstName,
					lastName,
					image,
					isVerified,
				},
			});
			return this.mapToDomain(created);
		} catch (error) {
			logger.error("Failed to create user:", error);
			throw error;
		}
	}

	async findByEmail(email: string): Promise<User | null> {
		try {
			const user = await this.prisma.user.findFirst({
				where: { email },
			});
			return user ? this.mapToDomain(user) : null;
		} catch (error) {
			logger.error(`Failed to find user by email ${email}:`, error);
			throw error;
		}
	}

	async findById(id: string): Promise<User | null> {
		try {
			const user = await this.prisma.user.findFirst({
				where: { id },
			});
			return user ? this.mapToDomain(user) : null;
		} catch (error) {
			logger.error(`Failed to find user by ID ${id}:`, error);
			throw error;
		}
	}

	async markAsVerified(userId: string, email: string): Promise<User | null> {
		try {
			const updated = await this.prisma.user.update({
				where: { id: userId, email, isVerified: false },
				data: { isVerified: true },
			});
			return this.mapToDomain(updated);
		} catch (error) {
			logger.error(`Failed to mark user as verified (ID: ${userId}):`, error);
			throw error;
		}
	}

	async currentVideoCount(userId: string): Promise<number> {
		try {
			const user = await this.prisma.user.findUnique({
				where: { id: userId },
				select: { totalVideoCount: true },
			});
			return user?.totalVideoCount ?? 0;
		} catch (error) {
			logger.error(`Failed to get video count for user ${userId}:`, error);
			throw error;
		}
	}

	async incrementVideoCount(userId: string): Promise<number> {
		try {
			const updatedUser = await this.prisma.user.update({
				where: { id: userId },
				data: { totalVideoCount: { increment: 1 } },
				select: { totalVideoCount: true },
			});
			return updatedUser.totalVideoCount ?? 0;
		} catch (error) {
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === "P2025"
			) {
				logger.warn(`User ${userId} not found for incrementVideoCount`);
				return 0;
			}
			logger.error(
				`Failed to increment video count for user ${userId}:`,
				error
			);
			throw error;
		}
	}

	async decrementVideoCount(userId: string): Promise<number> {
		try {
			const user = await this.prisma.user.findUnique({
				where: { id: userId },
				select: { totalVideoCount: true },
			});

			if (!user) {
				logger.warn(`User ${userId} not found for decrementVideoCount`);
				return 0;
			}

			const currentCount = user.totalVideoCount ?? 0;
			if (currentCount <= 0) {
				return 0;
			}

			const updatedUser = await this.prisma.user.update({
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
				logger.warn(`User ${userId} not found for decrementVideoCount`);
				return 0;
			}
			logger.error(
				`Failed to decrement video count for user ${userId}:`,
				error
			);
			throw error;
		}
	}

	async getTotalUsersCount(): Promise<number> {
		try {
			return await this.prisma.user.count();
		} catch (error) {
			logger.error("Failed to get total users count:", error);
			throw error;
		}
	}

	async getBannedUsersCount(): Promise<number> {
		try {
			return await this.prisma.user.count({ where: { isBanned: true } });
		} catch (error) {
			logger.error("Failed to get banned users count:", error);
			throw error;
		}
	}

	async getUsersSignedUpBetween(
		startDate: Date,
		endDate: Date
	): Promise<number> {
		try {
			return await this.prisma.user.count({
				where: { createdAt: { gte: startDate, lte: endDate } },
			});
		} catch (error) {
			logger.error("Failed to get users signed up between dates:", error);
			throw error;
		}
	}
}
