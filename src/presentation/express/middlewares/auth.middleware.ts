import { Request, Response, NextFunction } from "express";
import { Container } from "typedi";
import { IHttpRequest } from "@/presentation/http/helpers/IHttpRequest";
import { AuthenticateUserController } from "@/presentation/http/controllers/authenticate/Authenticate";

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
	const authenticateUserController = Container.get(AuthenticateUserController);

	const httpRequest: IHttpRequest = {
		body: req.body,
		params: req.params,
		query: req.query,
		headers: req.headers,
		cookies: req.cookies,
		user: req.user,
		file: req.file,
		res,
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
