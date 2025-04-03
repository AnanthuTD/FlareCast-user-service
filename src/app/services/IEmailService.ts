export interface IEmailService {
  isUserVerified(userId: string): Promise<boolean>;
}