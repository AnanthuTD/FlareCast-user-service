export interface ElectronPostLoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName?: string | null;
    image?: string | null;
  };
}