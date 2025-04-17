export enum ResponseMessage {
	UNAUTHORIZED = "UNAUTHORIZED",
	FORBIDDEN = "FORBIDDEN",
	NOT_FOUND = "NOT_FOUND",
	INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
	BAD_REQUEST = "BAD_REQUEST",
	CONFLICT = "CONFLICT",
	USER_NOT_FOUND = "User not found",
	FAILED_TO_UPLOAD_IMAGE = "Failed to upload image",
	FAILED_TO_UPDATE_PROFILE = "Failed to update profile",

	NO_ACTIVE_SUBSCRIPTION = "You don't have an active subscription plan",
	CANCEL_SUBSCRIPTION_FAILED = "Cancel subscription failed",

	PLAN_ID_REQUIRED = "Plan ID is required",
  USER_ALREADY_SUBSCRIBED="User already has an active subscription",
  SubscriptionPlanNotFound="Subscription plan not found",
  FailedToCreateSubscription="Failed to create subscription on Razorpay"
}
