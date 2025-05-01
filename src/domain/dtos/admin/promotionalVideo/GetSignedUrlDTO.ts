import { PromotionalVideoCategory } from "@/domain/entities/PromotionalVideo";

export interface GetSignedUrlDTO {
  title?: string;
  description?: string;
  fileName: string;
  category: PromotionalVideoCategory
}