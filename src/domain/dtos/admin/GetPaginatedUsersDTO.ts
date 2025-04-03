export interface GetPaginatedUsersDTO {
  page: number;
  limit: number;
  searchQuery: string;
  includeBanned: boolean;
}