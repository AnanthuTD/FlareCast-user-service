export interface RefreshTokenResponseDTO {
  accessToken: string;
  refreshToken?: string; // Optional, as we might not always generate a new refresh token
  message: string;
}