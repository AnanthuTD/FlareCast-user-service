import { User } from "@/domain/entities/User";

export interface PaginatedUsersResult {
	users: User[];
	total: number;
	totalPages: number;
	currentPage: number;
}

export interface CanSubscribeResult {
	canSubscribe: boolean;
	message?: string;
	code?: string;
}

export interface IUsersRepository {
	findPaginatedUsers({
		page,
		limit,
		searchQuery,
		includeBanned,
	}: {
		page?: number;
		limit?: number;
		searchQuery?: string;
		includeBanned?: boolean;
	}): Promise<PaginatedUsersResult>;

	updateUserBanStatus(id: string, isBanned: boolean): Promise<User>;

	canSubscribe(id: string): Promise<CanSubscribeResult>;

	userExists(
		email: string
	): Promise<{ method: "credential" | "google" } | null>;

	create(data: {
		email: string;
		hashedPassword?: string;
		firstName: string;
		lastName: string;
		image?: string;
		isVerified: boolean;
	}): Promise<User>;

	findByEmail(email: string): Promise<User | null>;

	findById(id: string): Promise<User | null>;

	update(data: {
		id: string;
		firstName?: string;
		lastName?: string;
		hashedPassword?: string;
		image?: string;
	}): Promise<User | null>;

	markAsVerified(userId: string, email: string): Promise<User | null>;

	currentVideoCount(userId: string): Promise<number>;

	incrementVideoCount(userId: string): Promise<number>;

	decrementVideoCount(userId: string): Promise<number>;

	getTotalUsersCount(): Promise<number>;

	getBannedUsersCount(): Promise<number>;

	getUsersSignedUpBetween(startDate: Date, endDate: Date): Promise<number>;
}
