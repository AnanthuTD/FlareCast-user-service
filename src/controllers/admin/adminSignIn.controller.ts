import { Request, Response, NextFunction } from "express";
import TokenService from "../../helpers/TokenService";
import env from "../../env";
import bcrypt from "bcryptjs";
import prisma from "../../prismaClient";
import HttpStatusCodes from "../../common/HttpStatusCodes";

interface AdminSigninRequest extends Request {
	body: {
		email: string;
		password: string;
	};
	user?: { id: string; email: string };
}

// Admin sign-in handler
const adminSignin = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { email, password } = (req as AdminSigninRequest).body;

		// Validate input
		if (!email || !password) {
			res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Email and password are required" });
			return;
		}

		// Find admin in Prisma
		const admin = await prisma.admin.findUnique({
			where: { email },
		});

		if (
			!admin ||
			!admin.hashedPassword ||
			!(await bcrypt.compare(password, admin.hashedPassword))
		) {
			res.status(HttpStatusCodes.UNAUTHORIZED).json({ message: "Invalid credentials" });
			return;
		}

		// Generate tokens
		const userPayload = { id: admin.id, type: "admin" };
		const accessToken = TokenService.generateToken(
			userPayload,
			env.ACCESS_TOKEN_SECRET as string
		);
		const refreshToken = TokenService.generateToken(
			userPayload,
			env.REFRESH_TOKEN_SECRET as string
		);

		// Set cookies with security options
		res.cookie("accessToken", accessToken, {
			secure: env.NODE_ENV === "production",
			sameSite: "strict",
			// maxAge: 15 * 60 * 1000, // 15 minutes
		});

		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		// Respond with admin data (no tokens needed in body since they're in cookies)
		res.json({
			admin: {
				id: admin.id,
				email: admin.email,
				firstName: admin.firstName,
				lastName: admin.lastName,
			},
		});
	} catch (error) {
		console.error("Admin sign-in error:", error);
		res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
		next(error); // Pass to error-handling middleware if you have one
	}
};

export default adminSignin;
