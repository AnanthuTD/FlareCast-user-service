import EventName from "@/app/event-names";
import { TOKENS } from "@/app/tokens";
import container from "@/infra/di-container";
import { authenticateWebsocketUser } from "@/presentation/express/middlewares/socketAuth.middleware";
import { Namespace, Socket } from "socket.io";
import { EventEmitter } from "stream";

export const setupSubscriptionNamespace = (namespace: Namespace) => {
	namespace.use(authenticateWebsocketUser);
	const eventEmitter = container.get(TOKENS.EventEmitter) as EventEmitter;

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
