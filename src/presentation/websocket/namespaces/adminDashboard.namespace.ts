import EventName from "@/app/event-names";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { TOKENS } from "@/app/tokens";
import container from "@/infra/di-container";
import { authenticateWebsocketAdmin } from "@/presentation/express/middlewares/socketAuthMiddleware";
import { Namespace, Socket } from "socket.io";
import { EventEmitter } from "stream";

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

		const totalUsers = (
			(await container.get(TOKENS.UserRepository)) as IUsersRepository
		).getTotalUsersCount();
		const sevenDaysAgo = new Date();
		sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
		const newSignups = (
			(await container.get(TOKENS.UserRepository)) as IUsersRepository
		).getUsersSignedUpBetween(sevenDaysAgo, new Date());
		const activeUsers = userNamespace.sockets.size;
		const subscriptionData = await (
			(await container.get(
				TOKENS.UserSubscriptionRepository
			)) as IUsersRepository
		).getLatestSubscriptions();
		const activeSubscriptionsCount = await (
			(await container.get(
				TOKENS.UserSubscriptionRepository
			)) as IUsersRepository
		).activeSubscriptionsCount();

		namespace.emit(EventName.ADMIN_DASHBOARD_INITIAL_DATA, {
			totalUsers,
			newSignups,
			activeUsers,
			subscriptions: subscriptionData,
			activeSubscriptionsCount,
		});
	});

	const eventEmitter = container.get(TOKENS.EventEmitter) as EventEmitter;

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
