export enum RefreshTokenErrorType {
  MissingRefreshToken = "MISSING_REFRESH_TOKEN",
  InvalidRefreshToken = "INVALID_REFRESH_TOKEN",
  RefreshTokenBlacklisted = "REFRESH_TOKEN_BLACKLISTED",
  UserNotFound = "USER_NOT_FOUND",
  UserBanned = "USER_BANNED",
}