export interface GetAdminProfileResponseDTO {
  admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "admin";
  };
}