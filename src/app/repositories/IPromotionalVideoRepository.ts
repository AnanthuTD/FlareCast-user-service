export interface IPromotionalVideoRepository {
  updateTitleAndDescription(videoId: string, title: string, description: string): Promise<void>;
}