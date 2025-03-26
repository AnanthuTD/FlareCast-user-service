export interface GoogleSignInResponseDTO {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName?: string | null;
    image?: string | null;
  };
  accessToken: string;
  refreshToken: string;
}