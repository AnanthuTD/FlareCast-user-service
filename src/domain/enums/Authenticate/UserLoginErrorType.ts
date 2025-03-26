export enum UserLoginErrorType {
  InvalidCredentials = "INVALID_CREDENTIALS",
  UserNotFound = "USER_NOT_FOUND",
  UserBanned = "USER_BANNED",
  UserNotVerified = "USER_NOT_VERIFIED",
  FailedToVerifyUser = "FAILED_TO_VERIFY_USER",
  EmailServiceUnavailable = "EMAIL_SERVICE_UNAVAILABLE",
}