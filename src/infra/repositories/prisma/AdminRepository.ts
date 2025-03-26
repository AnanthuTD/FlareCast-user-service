import { inject, injectable } from "inversify";
import { IAdminRepository } from "@/app/repositories/IAdminRepository";
import { logger } from "@/infra/logger";
import { TOKENS } from "@/app/tokens";
import { PrismaClient } from "@prisma/client";

@injectable()
export class AdminRepository implements IAdminRepository {
	constructor(
		@inject(TOKENS.PrismaClient) private readonly prisma: PrismaClient
	) {}

	async findById(id: string): Promise<{
		id: string;
		email: string;
		firstName: string;
		lastName: string;
	} | null> {
		try {
			const admin = await this.prisma.admin.findUnique({
				where: { id },
			});
			if (!admin) {
				return null;
			}
			return {
				id: admin.id,
				email: admin.email,
				firstName: admin.firstName,
				lastName: admin.lastName ?? "",
			};
		} catch (err: any) {
			logger.error(`Error finding admin ${id}:`, {
				message: err.message,
				stack: err.stack,
			});
			throw err;
		}
	}

	async findByEmail(email: string): Promise<{
		id: string;
		email: string;
		firstName: string;
		lastName: string;
		type: string;
		hashedPassword?: string;
	} | null> {
		try {
			const admin = await this.prisma.admin.findUnique({
				where: { email },
			});
			if (!admin) {
				return null;
			}
			return {
				id: admin.id,
				email: admin.email,
				firstName: admin.firstName,
				lastName: admin.lastName ?? '',
				type: "admin",
				hashedPassword: admin.hashedPassword || undefined,
			};
		} catch (err: any) {
			logger.error(`Error finding admin by email ${email}:`, {
				message: err.message,
				stack: err.stack,
			});
			throw err;
		}
	}
}
