export interface AdminSignInResponseDTO {
  admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}