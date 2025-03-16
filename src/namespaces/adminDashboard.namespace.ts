import { Namespace, Socket } from "socket.io";
import eventEmitter from "../eventEmitter";
import EventName from "../eventEmitter/eventNames";
import { authenticateWebsocketAdmin } from "../middlewares/socketAuth.middleware";
import Container from "typedi";
import { UserRepository } from "../repositories/userRepository";
import { UserSubscriptionRepository } from "../repositories/userSubscription.repository";

export const setupAdminDashboardNamespace = (
	namespace: Namespace,
	userNamespace
) => {
	namespace.use(authenticateWebsocketAdmin);

	namespace.on("connection", async (socket: Socket) => {
		console.log(
			`🟢 Admin ${socket.id} connected to /admin-dashboard adminId: ${socket.admin.id}`
		);

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

		const totalUsers = await Container.get(UserRepository).getTotalUsersCount();
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
		const newSignups = await Container.get(
			UserRepository
		).getUsersSignedUpBetween(sevenDaysAgo, new Date());
		const activeUsers = userNamespace.sockets.size;
		const subscriptionData = await Container.get(
			UserSubscriptionRepository
		).getLatestSubscriptions();
		const activeSubscriptionsCount = await Container.get(
			UserSubscriptionRepository
		).activeSubscriptionsCount();

		namespace.emit(EventName.ADMIN_DASHBOARD_INITIAL_DATA, {
			totalUsers,
			newSignups,
			activeUsers,
			subscriptions: subscriptionData,
			activeSubscriptionsCount,
		});
	});

	// Existing events
	eventEmitter.on(EventName.ACTIVE_USERS_COUNT, (activeUserCount) => {
		console.log("emitting active users count: ", activeUserCount);
		namespace.emit(EventName.ACTIVE_USERS_COUNT, { count: activeUserCount });
	});

	eventEmitter.on(EventName.NEW_USER_SIGNUP, (userData) => {
		console.log("emitting new users data: ", userData);
		namespace.emit(EventName.NEW_USER_SIGNUP, { data: userData });
	});

	// Subscription updates
	eventEmitter.on(EventName.SUBSCRIPTION_UPDATE, (subscriptionData) => {
		console.log("emitting subscription update: ", subscriptionData);
		namespace.emit(EventName.SUBSCRIPTION_UPDATE, { data: subscriptionData });
	});
};
