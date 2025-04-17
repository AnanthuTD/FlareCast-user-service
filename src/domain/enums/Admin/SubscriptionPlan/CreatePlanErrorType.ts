export enum CreatePlanErrorType {
  MissingName = "MISSING_NAME",
  MissingPaidPlanFields = "MISSING_PAID_PLAN_FIELDS",
  InvalidPeriod = "INVALID_PERIOD",
  ActiveFreePlanExists = "ACTIVE_FREE_PLAN_EXISTS",
  RazorpayError = "RAZORPAY_ERROR",
  InternalError = "INTERNAL_ERROR",
}