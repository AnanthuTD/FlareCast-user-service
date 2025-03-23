export interface SignUpResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    image?: string | null;
  };
  message: string;
}