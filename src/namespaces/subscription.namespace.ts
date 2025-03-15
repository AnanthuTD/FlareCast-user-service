import { Namespace, Socket } from "socket.io";
import eventEmitter from "../eventEmitter";
import EventName from "../eventEmitter/eventNames";
import { authenticateWebsocketUser } from "../middlewares/socketAuth.middleware";

export const setupSubscriptionNamespace = (namespace: Namespace) => {
	namespace.use(authenticateWebsocketUser);

	namespace.on("connection", (socket: Socket) => {
		console.log(
			`User ${socket.id} connected to /subscriptions userId: ${socket.user.id}`
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
			console.log(`User ${socket.id} disconnected from /subscriptions`);
		});
	});

	eventEmitter.on(EventName.SUBSCRIPTION_STATUS_UPDATE, (userId: string) => {
		console.log("emitting subscription status update to user: ", userId);
		namespace.to(`user:${userId}`).emit(EventName.SUBSCRIPTION_STATUS_UPDATE);
	});
};
