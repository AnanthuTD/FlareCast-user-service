import express, { Request, Response } from "express";
import { expressAdapter } from "@/presentation/adapters/express";
import { TOKENS } from "@/app/tokens";
import container from "@/infra/di-container";

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
const electronPostLoginController = container.get(TOKENS.ElectronPostLoginController);
const userExistController = container.get(TOKENS.UserExistController);

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
	res.cookie("accessToken", adapter.body.accessToken);
	res.cookie("refreshToken", adapter.body.refreshToken);
	res.status(adapter.statusCode).json(adapter.body);
});

/**
 * Endpoint to sign in a user (public).
 */
authRoutes.post("/sign-in", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, signInController);
	res.cookie("accessToken", adapter.body.accessToken);
	res.cookie("refreshToken", adapter.body.refreshToken);
	res.status(adapter.statusCode).json(adapter.body);
});

/**
 * Endpoint to sign in with Google (public).
 */
authRoutes.post("/google-sign-in", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, googleSignInController);
	res.cookie("accessToken", adapter.body.accessToken);
	res.cookie("refreshToken", adapter.body.refreshToken);
	res.status(adapter.statusCode).json(adapter.body);
});

/**
 * Endpoint to refresh access token (requires authentication).
 */
authRoutes.get("/refresh-token", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, refreshTokenController);
	res.cookie("accessToken", adapter.body.accessToken);
	res.cookie("refreshToken", adapter.body.refreshToken);
	res.status(adapter.statusCode).json(adapter.body);
});

/**
 * Endpoint to log out a user (requires authentication).
 */
authRoutes.post("/logout", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, userLogoutController);
	res.cookie("accessToken", adapter.body.accessToken);
	res.cookie("refreshToken", adapter.body.refreshToken);
	res.status(adapter.statusCode).json(adapter.body);
});

/**
 * Endpoint for Electron post-login (public).
 */
authRoutes.post("/post-login", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, electronPostLoginController);
	res.cookie("accessToken", adapter.body.accessToken);
	res.cookie("refreshToken", adapter.body.refreshToken);
	res.status(adapter.statusCode).json(adapter.body);
});

export default authRoutes;
