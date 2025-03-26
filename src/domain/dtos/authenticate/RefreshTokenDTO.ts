export interface RefreshTokenDTO {
  accessToken?: string; // Optional, as the token might not be present or might be expired
  refreshToken?: string;
}