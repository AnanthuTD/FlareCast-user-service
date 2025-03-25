import passport from "passport";
import { Socket } from "socket.io";
import { authenticateAdminMiddleware } from "./authAdminMiddleware";
import container from "@/infra/di-container";
import { IController } from "@/presentation/http/controllers/IController";
import { TOKENS } from "@/app/tokens";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";

/**
 * Middleware for authenticating users using Passport
 */
const authenticateUserController = container.get<IController>(
	TOKENS.AuthenticateUserController
);
export const authenticateWebsocketUser = async (
	socket: Socket,
	next: (err?: Error) => void
) => {
	const token = socket.handshake.auth.token;

	if (!token) {
		return next(new Error("Unauthorized: No token provided"));
	}

	const httpRequest: IHttpRequest = {
		cookies: {
			accessToken: token,
		},
	};

	const httpResponse = await authenticateUserController.handle(httpRequest);

	if (httpResponse.statusCode !== 200) {
		console.error("Unauthorized: " + httpResponse);
		next(new Error(`Unauthorized`));
		return;
	}

	// Attach the authenticated user to the request object
	socket.user = httpResponse.body.user;
	next();
};

/**
 * Middleware for authenticating admin using Passport
 */

const authenticateAdminController = container.get<IController>(
	TOKENS.AuthenticateAdminController
);

export const authenticateWebsocketAdmin = async (
	socket: Socket,
	next: (err?: Error) => void
) => {
	const token = socket.handshake.auth.token;

	if (!token) {
		return next(new Error("Unauthorized: No token provided"));
	}

	const httpRequest: IHttpRequest = {
		cookies: {
			accessToken: token,
		},
	};

	const httpResponse = await authenticateAdminController.handle(httpRequest);

	if (httpResponse.statusCode !== 200) {
		console.error("Unauthorized: " + httpResponse);
		next(new Error(`Unauthorized`));
		return;
	}

	// Attach the authenticated user to the request object
	socket.user = httpResponse.body.user;
	next();
};
