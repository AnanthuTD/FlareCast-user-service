import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { socketAuthMiddleware } from "../middlewares/socketAuth";
import {
	setupSubscriptionNamespace,
} from "../namespaces/subscription.namespace";

export function initializeSocket(server: HttpServer) {
	const io = new Server(server, {
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
			credentials: true,
		},
	});

	// Apply authentication middleware to all connections
	io.use(socketAuthMiddleware);

	// Define namespaces
	const subscriptionNamespace = io.of("/subscriptions");

	// Setup namespace logic
	setupSubscriptionNamespace(subscriptionNamespace);

	return io;
}
