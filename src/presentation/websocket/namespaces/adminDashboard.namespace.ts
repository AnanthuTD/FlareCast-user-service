import EventName from "@/app/event-names";
import { ILocalEventEmitter } from "@/app/providers/ILocalEventEmitter";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { IUserSubscriptionRepository } from "@/app/repositories/IUserSubscriptionRepository";
import { TOKENS } from "@/app/tokens";
import container from "@/infra/di-container";
import { authenticateWebsocketAdmin } from "@/presentation/express/middlewares/socketAuthMiddleware";
import { Namespace, Socket } from "socket.io";

export const setupAdminDashboardNamespace = (
	namespace: Namespace,
	userNamespace: Namespace
) => {
	namespace.use(authenticateWebsocketAdmin);

	namespace.on("connection", async (socket: Socket) => {
		try {
			console.log(`🟢 Admin ${socket.id} connected to /admin-dashboard`);

			const admin = (socket as any).admin;
			if (!admin || !admin.id) {
				socket.emit("error", { message: "User authentication failed" });
				socket.disconnect();
				return;
			}
			const adminId: string = admin.id;
			socket.join(`admin:${adminId}`);

			socket.on("disconnect", () => {
				console.log(`User ${socket.id} disconnected from /admin-dashboard`);
			});

			// Ensure repositories are retrieved safely
			const userRepository = container.get(
				TOKENS.UserRepository
			) as IUsersRepository;
			const subscriptionRepository = container.get(
				TOKENS.UserSubscriptionRepository
			) as IUserSubscriptionRepository;

			if (!userRepository || !subscriptionRepository) {
				console.error("❌ Repositories not found in the DI container.");
				socket.emit("error", { message: "Internal server error" });
				return;
			}

			// Fetch data safely
			const totalUsers = await userRepository.getTotalUsersCount();
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
			const newSignups = await userRepository.getUsersSignedUpBetween(
				sevenDaysAgo,
				new Date()
			);

			// Ensure userNamespace is valid before accessing `.sockets`
			const activeUsers = userNamespace?.sockets
				? userNamespace.sockets.size
				: 0;

			const subscriptionData =
				await subscriptionRepository.getLatestSubscriptions();
			const activeSubscriptionsCount =
				await subscriptionRepository.activeSubscriptionsCount();

			// Emit the collected data
			namespace.emit(EventName.ADMIN_DASHBOARD_INITIAL_DATA, {
				totalUsers,
				newSignups,
				activeUsers,
				subscriptions: subscriptionData,
				activeSubscriptionsCount,
			});
		} catch (error) {
			console.error("❌ Error in setupAdminDashboardNamespace:", error);
			socket.emit("error", { message: "An unexpected error occurred" });
			socket.disconnect();
		}
	});

	// Get event emitter safely
	const eventEmitter = container.get(TOKENS.EventEmitter) as ILocalEventEmitter;
	if (!eventEmitter) {
		console.error("❌ EventEmitter not found in DI container.");
		return;
	}

	// Prevent duplicate event listeners
	// eventEmitter.removeAllListeners(EventName.ACTIVE_USERS_COUNT);
	// eventEmitter.removeAllListeners(EventName.NEW_USER_SIGNUP);
	// eventEmitter.removeAllListeners(EventName.SUBSCRIPTION_UPDATE);

	// Reattach event listeners
	eventEmitter.on(EventName.ACTIVE_USERS_COUNT, (activeUserCount) => {
		console.log("🔹 Emitting active users count:", activeUserCount);
		namespace.emit(EventName.ACTIVE_USERS_COUNT, { count: activeUserCount });
	});

	eventEmitter.on(EventName.NEW_USER_SIGNUP, (userData) => {
		console.log("🔹 Emitting new users data:", userData);
		namespace.emit(EventName.NEW_USER_SIGNUP, { data: userData });
	});

	eventEmitter.on(EventName.SUBSCRIPTION_UPDATE, (subscriptionData) => {
		console.log("🔹 Emitting subscription update:", subscriptionData);
		namespace.emit(EventName.SUBSCRIPTION_UPDATE, { data: subscriptionData });
	});
};
