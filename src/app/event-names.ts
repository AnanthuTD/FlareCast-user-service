enum EventName {
	SUBSCRIPTION_STATUS_UPDATE = "subscription:status:update",

	// admin
	ACTIVE_USERS_COUNT = "active:users:count",
	NEW_USER_SIGNUP = "new:users:signup",
	SUBSCRIPTION_UPDATE = "subscription:update",
	ADMIN_DASHBOARD_INITIAL_DATA="initial:data"
}

export default EventName;
