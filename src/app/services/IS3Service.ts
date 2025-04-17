export interface IS3Service {
  uploadProfileImage(userId: string, file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<string>;
}