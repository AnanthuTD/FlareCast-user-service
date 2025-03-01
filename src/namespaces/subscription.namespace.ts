import { Namespace, Socket } from "socket.io";
import Container, { Service } from "typedi";
import eventEmitter from "../eventEmitter";
import EventName from "../eventEmitter/eventNames";
import passport from "passport";

/**
 * Middleware for authenticating delivery partners using Passport
 */
const authenticate = (socket: Socket, next: (err?: Error) => void) => {
	const token = socket.handshake.auth.token;

	if (!token) {
		return next(new Error("Unauthorized: No token provided"));
	}

	socket.request.headers["authorization"] = `Bearer ${token}`;

	passport.authenticate("jwt", { session: false }, (err, user) => {
		if (err || !user) {
			return next(new Error("Unauthorized: Invalid token"));
		}
		socket.user = user;
		next();
	})(socket.request, {}, next);
};

export const setupSubscriptionNamespace = (namespace: Namespace) => {
	namespace.use(authenticate);

	namespace.on("connection", (socket: Socket) => {
		console.log(
			`User ${socket.id} connected to /user/subscriptions userId: ${socket.user.id}`
		);

		const user = (socket as any).user;
		if (!user || !user.id) {
			socket.emit("error", { message: "User authentication failed" });
			socket.disconnect();
			return;
		}
		const userId: string = user.id;

		socket.join(`user:${userId}`);

		// Handle disconnection
		socket.on("disconnect", () => {
			console.log(`User ${socket.id} disconnected from /vendor/subscriptions`);
		});
	});

	eventEmitter.on(EventName.SUBSCRIPTION_STATUS_UPDATE, (userId: string) => {
		console.log("emitting subscription status update to vendor: ", userId);
		namespace.to(`user:${userId}`).emit(EventName.SUBSCRIPTION_STATUS_UPDATE);
	});
};
