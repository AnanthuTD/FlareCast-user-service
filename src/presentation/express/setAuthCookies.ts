import env from "@/infra/env";
import { Response } from "express";

// Utility function to set cookies conditionally
export const setAuthCookies = (
	res: Response,
	accessToken?: string,
	refreshToken?: string
) => {
	console.log("🐥 isProduction: ", env.NODE_ENV, env.isProduction, env.isProd)
	if (accessToken) {
		res.cookie("accessToken", accessToken, {
			httpOnly: false,
			secure: env.NODE_ENV === "production",
			sameSite: "none",
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
		});
	}

	if (refreshToken) {
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: env.NODE_ENV === "production",
			sameSite: "none",
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
		});
	}
};
