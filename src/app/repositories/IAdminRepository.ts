export interface IAdminRepository {
  findById(id: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null>;
  findByEmail(email: string): Promise<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    type: string;
    hashedPassword?: string;
  } | null>;
}