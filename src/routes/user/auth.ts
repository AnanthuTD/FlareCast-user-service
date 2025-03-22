// backend/src/infra/routes/auth-routes.ts
import { Router, Request, Response } from "express";
import { Container } from "typedi";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import {
	authenticateUser,
} from "@/presentation/express/middlewares/auth.middleware";

// Import controllers using TypeDI
import { SignUpController } from "@/presentation/http/controllers/authenticate/SignUp";
import { UserLoginController } from "@/presentation/http/controllers/user-login-controller";
import { UserExistController } from "@/presentation/http/controllers/authenticate/Exists";
import { GoogleSignInController } from "@/presentation/http/controllers/authenticate/GoogleSignin";
import { RefreshTokenController } from "@/presentation/http/controllers/authenticate/RefreshToken";
import { UserLogoutController } from "@/presentation/http/controllers/user-logout-controller";
import { ElectronPostLoginController } from "@/presentation/http/controllers/electron/PostLogin";
import { CheckIsAuthenticatedController } from "@/presentation/http/controllers/check-is-authenticated-controller";
import { SubscribeController } from "@/presentation/http/controllers/subscribe-controller";
import { CreateOrderController } from "@/presentation/http/controllers/create-order-controller";
import { VerifyPaymentController } from "@/presentation/http/controllers/verify-payment-controller";

/**
 * Router for handling authentication-related routes.
 */
const authRoutes = Router();

// Fetch controllers using TypeDI
const signUpController = Container.get(SignUpController);
const userLoginController = Container.get(UserLoginController);
const userExistController = Container.get(UserExistController);
const googleSignInController = Container.get(GoogleSignInController);
const refreshTokenController = Container.get(RefreshTokenController);
const userLogoutController = Container.get(UserLogoutController);
const electronPostLoginController = Container.get(ElectronPostLoginController);
const checkIsAuthenticatedController = Container.get(
	CheckIsAuthenticatedController
);
const subscribeController = Container.get(SubscribeController);
const createOrderController = Container.get(CreateOrderController);
const verifyPaymentController = Container.get(VerifyPaymentController);

/**
 * Endpoint to check if a user exists.
 */
authRoutes.get("/user-exist", async (req: Request, res: Response) => {
	const httpRequest: IHttpRequest = {
		body: req.body,
		params: req.params,
		query: req.query,
		headers: req.headers,
	};

	const httpResponse = await userExistController.handle(httpRequest);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

/**
 * Endpoint to sign up a new user.
 */
authRoutes.post("/sign-up", async (req: Request, res: Response) => {
	const httpRequest: IHttpRequest = {
		body: req.body,
		params: req.params,
		query: req.query,
		headers: req.headers,
		res,
	};

	const httpResponse = await signUpController.handle(httpRequest);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

/**
 * Endpoint to sign in a user (local authentication).
 */
authRoutes.post(
	"/sign-in",
	authenticateLocal,
	async (req: Request, res: Response) => {
		const httpRequest: IHttpRequest = {
			body: req.body,
			params: req.params,
			query: req.query,
			headers: req.headers,
			user: req.user,
			res,
		};

		const httpResponse = await userLoginController.handle(httpRequest);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
);

/**
 * Endpoint for Google sign-in.
 */
authRoutes.post("/google-sign-in", async (req: Request, res: Response) => {
	const httpRequest: IHttpRequest = {
		body: req.body,
		params: req.params,
		query: req.query,
		headers: req.headers,
		res,
	};

	const httpResponse = await googleSignInController.handle(httpRequest);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

/**
 * Endpoint to refresh an access token.
 */
authRoutes.get("/refresh-token", async (req: Request, res: Response) => {
	const httpRequest: IHttpRequest = {
		body: req.body,
		params: req.params,
		query: req.query,
		headers: req.headers,
		res,
	};

	const httpResponse = await refreshTokenController.handle(httpRequest);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

/**
 * Endpoint to log out a user (requires authentication).
 */
authRoutes.post(
	"/logout",
	authenticateUser,
	async (req: Request, res: Response) => {
		const httpRequest: IHttpRequest = {
			body: req.body,
			params: req.params,
			query: req.query,
			headers: req.headers,
			user: req.user,
			res,
		};

		const httpResponse = await userLogoutController.handle(httpRequest);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
);

/**
 * Endpoint for Electron post-login.
 */
authRoutes.post("/post-login", async (req: Request, res: Response) => {
	const httpRequest: IHttpRequest = {
		body: req.body,
		params: req.params,
		query: req.query,
		headers: req.headers,
		res,
	};

	const httpResponse = await electronPostLoginController.handle(httpRequest);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

/**
 * Endpoint to check if a user is authenticated (requires authentication).
 */
authRoutes.get(
	"/check-authentication",
	authenticateUser,
	async (req: Request, res: Response) => {
		const httpRequest: IHttpRequest = {
			body: req.body,
			params: req.params,
			query: req.query,
			headers: req.headers,
			user: req.user,
		};

		const httpResponse = await checkIsAuthenticatedController.handle(
			httpRequest
		);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
);

/**
 * Endpoint to subscribe a user to a plan (requires authentication).
 */
authRoutes.post(
	"/subscribe",
	authenticateUser,
	async (req: Request, res: Response) => {
		const httpRequest: IHttpRequest = {
			body: req.body,
			params: req.params,
			query: req.query,
			headers: req.headers,
			user: req.user,
		};

		const httpResponse = await subscribeController.handle(httpRequest);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
);

/**
 * Endpoint to create a Razorpay order (requires authentication).
 */
authRoutes.post(
	"/create-order",
	authenticateUser,
	async (req: Request, res: Response) => {
		const httpRequest: IHttpRequest = {
			body: req.body,
			params: req.params,
			query: req.query,
			headers: req.headers,
			user: req.user,
		};

		const httpResponse = await createOrderController.handle(httpRequest);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
);

/**
 * Endpoint to verify a Razorpay payment (requires authentication).
 */
authRoutes.post(
	"/verify-payment",
	authenticateUser,
	async (req: Request, res: Response) => {
		const httpRequest: IHttpRequest = {
			body: req.body,
			params: req.params,
			query: req.query,
			headers: req.headers,
			user: req.user,
		};

		const httpResponse = await verifyPaymentController.handle(httpRequest);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
);

export { authRoutes };
