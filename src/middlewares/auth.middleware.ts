import { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import env from "../env";

export const authMiddleware: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		// Extract accessToken from cookies
		const token = req.cookies?.accessToken;
		if (!token) {
			res.status(401).json({ message: "No token provided" });
			return;
		}

		// Verify and decode the token
		const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET as string) as {
			id: string;
			type: "user" | "admin";
			iat?: number;
			exp?: number;
		};

		// Check if token is valid (jwt.verify throws on expiration or invalidity)
		if (!decoded.id || !decoded.type) {
			res.status(401).json({ message: "Invalid token payload" });
			return;
		}

		req.user = {
			id: decoded.id,
			type: decoded.type,
		};

		next();
	} catch (error) {
		if (error instanceof jwt.TokenExpiredError) {
			res.status(401).json({ message: "Token has expired" });
			return;
		}
		if (error instanceof jwt.JsonWebTokenError) {
			res.status(401).json({ message: "Invalid token" });
			return;
		}
		console.error("Auth middleware error:", error);
		res.status(500).json({ message: "Internal server error" });
		return;
	}
};

export default authMiddleware;
