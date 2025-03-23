export interface GetMemberLimitResponseDTO {
  message: string;
  limit: number | null; // null or a negative number means unlimited
}