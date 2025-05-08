export interface BanUserResponseDTO {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isBanned: boolean;
    createdAt: Date;
  };
}