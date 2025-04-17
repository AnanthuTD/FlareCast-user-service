export interface UpdatePromotionalVideoDTO {
  id: string;
  category?: string;
  hidden?: boolean;
  priority?: number;
  startDate?: string;
  endDate?: string;
  title?: string;
  description?: string;
  createdBy?: string;
}