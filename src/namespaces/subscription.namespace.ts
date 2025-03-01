import { Namespace, Socket } from "socket.io";
import Container, { Service } from "typedi";
import eventEmitter from "../eventEmitter";
import EventName from "../eventEmitter/eventNames";

@Service()
export class SubscriptionNamespace {
	setupSubscriptionNamespace(namespace: Namespace) {
		namespace.on("connection", (socket: Socket) => {
			console.log(`User ${socket.id} connected to /user/subscriptions`);

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
				console.log(
					`User ${socket.id} disconnected from /vendor/subscriptions`
				);
			});
		});

		eventEmitter.on(EventName.SUBSCRIPTION_STATUS_UPDATE, (userId: string) => {
			console.log("emitting subscription status update to vendor: ", userId);
			namespace.to(`user:${userId}`).emit(EventName.SUBSCRIPTION_STATUS_UPDATE);
		});
	}
}

export const setupSubscriptionNamespace = Container.get(SubscriptionNamespace).setupSubscriptionNamespace;
