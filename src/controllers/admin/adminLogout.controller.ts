import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import env from "../../env";
import { BlacklistRefreshTokenUseCase } from "../../usecases/user/blacklistRefreshToken.usecase";
import { Inject, Service } from "typedi";
import prisma from "../../prismaClient";
import HttpStatusCodes from "../../common/HttpStatusCodes";

// Define request interface
interface AdminLogoutRequest extends Request {
	user?: { id: string; type: string };
	cookies: { [key: string]: string };
}

@Service()
export class AdminLogoutController {
	constructor(
		@Inject()
		private blacklistRefreshTokenUseCase: BlacklistRefreshTokenUseCase
	) {}

	// Admin logout handler
	execute = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const authHeader = req.headers["authorization"];
			if (!authHeader || !authHeader.startsWith("Bearer ")) {
				res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: "No valid token provided" });
				return;
			}

			const token = authHeader.split(" ")[1];
			const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET as string) as {
				id: string;
				type: string;
				exp?: number;
			};

			if (decoded.type !== "admin") {
				res.status(HttpStatusCodes.FORBIDDEN).json({ message: "Admin access required" });
				return;
			}

			// Extract refreshToken from cookie
			const refreshToken = req.cookies["refreshToken"];
			if (!refreshToken) {
				console.warn("No refresh token found in cookies");
				// Proceed with logout even if missing, since accessToken is cleared
			} else {
				// Blacklist the refresh token
				await this.blacklistRefreshTokenUseCase.execute(
					refreshToken,
					decoded.exp || Date.now() / 1000 + 7 * 24 * 60 * 60
				); // Default to 7 days if exp not present
			}

			// Find admin using 'id' instead of 'sub'
			const admin = await prisma.admin.findUnique({
				where: { id: decoded.id }, // Updated to use 'id'
			});

			if (!admin) {
				res.status(HttpStatusCodes.NOT_FOUND).json({ message: "Admin not found" });
				return;
			}

			// Clear cookies
			res.clearCookie("accessToken", {
				secure: env.NODE_ENV === "production",
				sameSite: "strict",
			});

			res.clearCookie("refreshToken", {
				httpOnly: true,
				secure: env.NODE_ENV === "production",
				sameSite: "strict",
			});

			// Update lastLogin
			await prisma.admin.update({
				where: { id: admin.id },
				data: { lastLogin: new Date() },
			});

			// Respond with success
			res.status(HttpStatusCodes.OK).json({ message: "Successfully logged out" });
		} catch (error) {
			console.error("Admin logout error:", error);
			if (error instanceof jwt.TokenExpiredError) {
				// Token expired, still clear cookies
				res.clearCookie("accessToken", {
					secure: env.NODE_ENV === "production",
					sameSite: "strict",
				});
				res.clearCookie("refreshToken", {
					httpOnly: true,
					secure: env.NODE_ENV === "production",
					sameSite: "strict",
				});
				res.status(HttpStatusCodes.OK).json({ message: "Logged out (token already expired)" });

				return;
			}
			res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
			next(error);
		}
	};
}

export default AdminLogoutController;
