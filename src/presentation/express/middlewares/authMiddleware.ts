import { Request, Response, NextFunction } from "express";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import container from "@/infra/di-container";
import { TOKENS } from "@/app/tokens";
import { IController } from "@/presentation/http/controllers/IController";

// Extend the Express Request type to include the user property
declare global {
	namespace Express {
		interface Request {
			user?: {
				id: string;
				email: string;
				firstName: string;
				lastName: string;
				image: string;
			};
		}
	}
}

/**
 * Middleware to authenticate a user by calling AuthenticateUserController.
 */
export const authenticateUserMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const authenticateUserController = container.get<IController>(TOKENS.AuthenticateUserController);

	const httpRequest: IHttpRequest = {
		body: req.body,
		params: req.params,
		query: req.query,
		headers: req.headers,
		cookies: req.cookies,
		user: req.user,
		file: req.file,
	};

	const httpResponse = await authenticateUserController.handle(httpRequest);

	if (httpResponse.statusCode !== 200) {
		res.status(httpResponse.statusCode).json(httpResponse.body);
		return;
	}

	// Attach the authenticated user to the request object
	req.user = httpResponse.body.user;
	next();
};
