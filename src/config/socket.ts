import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { setupSubscriptionNamespace } from "../namespaces/subscription.namespace";

export function initializeSocket(server: HttpServer) {
	const io = new Server(server, {
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
			credentials: true,
		},
	});

	io.on('connection', () => {
		console.log("Client connected");

    // Handle disconnections
    io.on('disconnect', () => {
      console.log("Client disconnected");
    });
	})

	// Apply authentication middleware to all connections
	// io.use(socketAuthMiddleware);

	// Define namespaces
	const subscriptionNamespace = io.of("/subscriptions");

	// Setup namespace logic
	setupSubscriptionNamespace(subscriptionNamespace);

	return io;
}
