import { User } from "@prisma/client";

export interface DependenciesInterface {
  useCases: UseCasesInterface;
  repository: RepositoryInterface;
}

export interface UseCasesInterface {
  user: UserUseCases,
}

export interface RepositoryInterface {
    userRepository: UserRepository;
}

export interface UserRepository {
  userExists: (email: string) => Promise<any>;
  createUser: (data: any) => Promise<User>;
  getUserByEmail: (email: string) => Promise<any>;
  getUserById: (id: string) => Promise<any>;
  
}

export interface UserUseCases {
}