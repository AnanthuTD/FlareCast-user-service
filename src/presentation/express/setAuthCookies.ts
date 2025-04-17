import env from "@/infra/env";
import { Response } from "express";

// Utility function to set cookies conditionally
export const setAuthCookies = (
	res: Response,
	accessToken?: string,
	refreshToken?: string
) => {
	if (accessToken) {
		res.cookie("accessToken", accessToken, {
			httpOnly: false,
			secure: env.isProd,
			sameSite: env.isProd ? "none" : "strict",
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
		});
	}

	if (refreshToken) {
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: env.isProd,
			sameSite: env.isProd ? "none" : "strict",
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
		});
	}
};
