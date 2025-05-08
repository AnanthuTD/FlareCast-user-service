export interface VideoUploadEvent {
  videoId: string;
  userId: string;
  title: string;
  description?: string;
  url: string;
  createdAt: string; // ISO date string
}