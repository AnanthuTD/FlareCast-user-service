import express, { Request, Response } from "express";
import { expressAdapter } from "@/presentation/adapters/express";
import { TOKENS } from "@/app/tokens";
import container from "@/infra/di-container";
import env from "@/infra/env";
import { setAuthCookies } from "../../setAuthCookies";
import { IController } from "@/presentation/http/controllers/IController";

/**
 * Router for handling authentication-related routes.
 */
const authRoutes = express.Router();

// Fetch controllers using TypeDI
const signUpController = container.get<IController>(TOKENS.SignUpController);
const signInController = container.get<IController>(TOKENS.SignInController);
const googleSignInController = container.get<IController>(TOKENS.GoogleSigninController);
const refreshTokenController = container.get<IController>(TOKENS.RefreshTokenController);
const userLogoutController = container.get<IController>(TOKENS.UserLogoutController);
const electronPostLoginController = container.get<IController>(
	TOKENS.ElectronPostLoginController
);
const userExistController = container.get<IController>(TOKENS.UserExistController);

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
