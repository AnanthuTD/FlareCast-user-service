export interface IPromotionalVideoRepository {
  updateTitleAndDescription(videoId: string, title: string, description: string): Promise<void>;
  create(data: {
    category: "PROMOTIONAL" | "NEW_FEATURE";
    hidden: boolean;
    videoId: string;
    priority: number;
    startDate: Date | null;
    endDate: Date | null;
    title: string | null;
    description: string | null;
    createdBy: string;
  }): Promise<{
    id: string;
    category: string;
    hidden: boolean;
    videoId: string;
    priority: number;
    startDate?: Date | null;
    endDate?: Date | null;
    title?: string | null;
    description?: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }>;

  findActiveVideos(): Promise<Array<{
    id: string;
    category: string;
    hidden: boolean;
    videoId: string;
    priority: number;
    startDate?: Date | null;
    endDate?: Date | null;
    title?: string | null;
    description?: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }>>;

  findById(id: string): Promise<{
    id: string;
    category: string;
    hidden: boolean;
    videoId: string;
    priority: number;
    startDate?: Date | null;
    endDate?: Date | null;
    title?: string | null;
    description?: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  } | null>;

  update(dto: {
    id: string;
    category?: string;
    hidden?: boolean;
    priority?: number;
    startDate?: string;
    endDate?: string;
    title?: string;
    description?: string;
    createdBy?: string;
  }): Promise<{
    id: string;
    category: string;
    hidden: boolean;
    videoId: string;
    priority: number;
    startDate?: Date | null;
    endDate?: Date | null;
    title?: string | null;
    description?: string | null;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
  }>;

  delete(id: string): Promise<void>;
}