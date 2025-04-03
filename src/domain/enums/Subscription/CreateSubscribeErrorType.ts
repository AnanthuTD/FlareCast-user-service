export enum CreateSubscribeErrorType {
  MissingUserId = "MISSING_USER_ID",
  MissingPlanId = "MISSING_PLAN_ID",
  CannotSubscribe = "CANNOT_SUBSCRIBE",
  ActiveSubscriptionExists = "ACTIVE_SUBSCRIPTION_EXISTS",
  SubscriptionPlanNotFound = "SUBSCRIPTION_PLAN_NOT_FOUND",
  UserNotFound = "USER_NOT_FOUND",
  FailedToCreateRazorpaySubscription = "FAILED_TO_CREATE_RAZORPAY_SUBSCRIPTION",
  FailedToCreateUserSubscription = "FAILED_TO_CREATE_USER_SUBSCRIPTION",
}