import express, { Request, Response } from "express";
import { expressAdapter } from "@/presentation/adapters/express";
import { TOKENS } from "@/app/tokens";
import container from "@/infra/di-container";
import env from "@/infra/env";

/**
 * Router for handling authentication-related routes.
 */
const authRoutes = express.Router();

// Fetch controllers using TypeDI
const signUpController = container.get(TOKENS.SignUpController);
const signInController = container.get(TOKENS.SignInController);
const googleSignInController = container.get(TOKENS.GoogleSigninController);
const refreshTokenController = container.get(TOKENS.RefreshTokenController);
const userLogoutController = container.get(TOKENS.UserLogoutController);
const electronPostLoginController = container.get(
	TOKENS.ElectronPostLoginController
);
const userExistController = container.get(TOKENS.UserExistController);

// Utility function to set cookies conditionally
const setAuthCookies = (
	res: Response,
	accessToken?: string,
	refreshToken?: string
) => {
	if (accessToken) {
		res.cookie("accessToken", accessToken, {
			httpOnly: false,
			secure: env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 15 * 60 * 1000, // 15 minutes
		});
	}

	if (refreshToken) {
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
		});
	}
};

/**
 * Endpoint to check if a user exists (public).
 */
authRoutes.get("/user-exist", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, userExistController);
	res.status(adapter.statusCode).json(adapter.body);
});

/**
 * Endpoint to sign up a new user (public).
 */
authRoutes.post("/sign-up", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, signUpController);
	res.status(adapter.statusCode).json(adapter.body);
});

/**
 * Endpoint to sign in a user (public).
 */
authRoutes.post("/sign-in", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, signInController);
	setAuthCookies(res, adapter.body.accessToken, adapter.body.refreshToken);
	res.status(adapter.statusCode).json(adapter.body);
});

/**
 * Endpoint to sign in with Google (public).
 */
authRoutes.post("/google-sign-in", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, googleSignInController);
	setAuthCookies(res, adapter.body.accessToken, adapter.body.refreshToken);
	res.status(adapter.statusCode).json(adapter.body);
});

/**
 * Endpoint to refresh access token (requires authentication).
 */
authRoutes.get("/refresh-token", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, refreshTokenController);
	setAuthCookies(res, adapter.body.accessToken, adapter.body.refreshToken);
	res.status(adapter.statusCode).json(adapter.body);
});

/**
 * Endpoint to log out a user (requires authentication).
 */
authRoutes.post("/logout", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, userLogoutController);
	res.clearCookie("refreshToken");
	res.clearCookie("accessToken");
	res.status(adapter.statusCode).json(adapter.body);
});

/**
 * Endpoint for Electron post-login (public).
 */
authRoutes.post("/post-login", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, electronPostLoginController);
	setAuthCookies(res, adapter.body.accessToken, adapter.body.refreshToken);
	res.status(adapter.statusCode).json(adapter.body);
});

export default authRoutes;
