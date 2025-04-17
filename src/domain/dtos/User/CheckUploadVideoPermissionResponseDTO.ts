export interface CheckUploadVideoPermissionResponseDTO {
  message: string;
  permission: "granted" | "denied";
  maxVideoCount: number | null;
  totalVideoUploaded: number;
}