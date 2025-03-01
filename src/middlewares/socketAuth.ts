import { ExtendedError, Socket } from "socket.io";
// import Cookies from "cookie";
import { UserRepository } from "../repositories/userRepository"; // Adjust path
import TokenService from "../helpers/TokenService";
import env from "../env";

const userRepository = new UserRepository();

export function socketAuthMiddleware(
	socket: Socket,
	next: (err?: ExtendedError) => void
) {
	try {
		// Parse cookies from handshake headers
		const cookieHeader = socket.handshake.headers.cookie;
		if (!cookieHeader) {
			return next(new Error("No cookies provided"));
		}

    console.log(cookieHeader, cookieHeader['accessToken'])

		// const cookies = Cookies.parse(cookieHeader);
		const authToken = cookieHeader["accessToken"]; // Assuming 'authToken' is your cookie name

		if (!authToken) {
			return next(new Error("Authentication token missing"));
		}

		// Verify token (e.g., JWT or session check)
		try {
			const { id } = TokenService.verifyToken(
				authToken,
				env.ACCESS_TOKEN_SECRET
			);

			if (!id) {
				return next(new Error("Invalid or expired token"));
			}

			// Attach user to socket for later use
			(socket as any).user = { id };
			next();
		} catch {
			next(new Error("Token verification failed"));
		}
	} catch (error) {
		next(new Error("Authentication error"));
	}
}
