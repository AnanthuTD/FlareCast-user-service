/**
 * Enum representing error types related to user authentication.
 *
 * @enum
 */
export enum AuthenticateUserErrorType {
  UserNotFound = "USER_NOT_FOUND",
  UserBanned = "USER_BANNED",
  InvalidToken = "INVALID_TOKEN",
}
