export interface GetPaginatedUsersResponseDTO {
  users: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isBanned: boolean;
    createdAt: Date;
  }>;
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}