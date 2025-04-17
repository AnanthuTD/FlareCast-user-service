export interface UploadVideoPermissionsResponseDTO {
  message: string;
  permission: "granted" | "denied";
  maxVideoCount: number | null;
  totalVideoUploaded: number;
  aiFeature: boolean;
  maxRecordDuration: number;
}