export interface UpdateProfileDTO {
  userId: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  file?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
}