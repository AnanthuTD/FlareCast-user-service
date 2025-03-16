import { Namespace, Socket } from "socket.io";
import eventEmitter from "../eventEmitter";
import EventName from "../eventEmitter/eventNames";
import { authenticateWebsocketUser } from "../middlewares/socketAuth.middleware";

export const setupUserNamespace = (namespace: Namespace) => {
	namespace.use(authenticateWebsocketUser);

	namespace.on("connection", (socket: Socket) => {
		console.log(
			`🟢 User ${socket.id} connected to /user userId: ${socket.user.id}`
		);

		const user = (socket as any).user;
		if (!user || !user.id) {
			socket.emit("error", { message: "User authentication failed" });
			socket.disconnect();
			return;
		}
		const userId: string = user.id;

		socket.join(`user:${userId}`);

		eventEmitter.emit(EventName.ACTIVE_USERS_COUNT, namespace.sockets.size);
	});

	// Handle disconnection
	namespace.on("disconnect", (socket) => {
		eventEmitter.emit(EventName.ACTIVE_USERS_COUNT, namespace.sockets.size);
		console.log(`User ${socket.user.id} disconnected from /user`);
	});
};
