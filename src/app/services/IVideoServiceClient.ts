export interface IVideoServiceClient {
  getSignedUrl(params: {
    title?: string;
    description?: string;
    type: string;
    videoExtension: string;
  }): Promise<{
    message: string;
    signedUrl: string;
    videoId: string;
  }>;
}