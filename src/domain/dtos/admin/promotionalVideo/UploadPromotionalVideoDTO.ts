export interface UploadPromotionalVideoDTO {
  category: string;
  hidden: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
  title?: string;
  description?: string;
  videoId: string;
  s3Key: string;
  createdBy: string;
}