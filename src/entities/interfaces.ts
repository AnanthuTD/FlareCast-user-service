import { User } from "@prisma/client";

export interface DependenciesInterface {
	useCases: UseCasesInterface;
	repository: RepositoryInterface;
}

export interface UseCasesInterface {
	user: UserUseCases;
}

export interface RepositoryInterface {
	userRepository: UserRepository;
	refreshTokenRepository: IRefreshTokenRepository;
}

export interface UserRepository {
	userExists: (email: string) => Promise<any>;
	createUser: (data: any) => Promise<User>;
	getUserByEmail: (email: string) => Promise<any>;
	getUserById: (id: string) => Promise<any>;
}

export interface UserUseCases {
	BlacklistRefreshTokenUseCase: IBlacklistRefreshTokenUseCase;
	ValidateRefreshTokenUseCase: IValidateRefreshTokenUseCase;
}

export class RefreshToken {
	constructor(
		public readonly token: string,
		public readonly userId: string,
		public readonly expiresAt: Date
	) {}

	isExpired(): boolean {
		return new Date() > this.expiresAt;
	}
}

export interface IRefreshTokenRepository {
	blacklistToken(token: string, expiresAt: number): Promise<void>;
	isTokenBlacklisted(token: string): Promise<boolean>;
}

export interface IBlacklistRefreshTokenUseCase {
	execute(token: string, expiresAt: number): Promise<void>;
}

export interface IValidateRefreshTokenUseCase {
	execute(token: string): Promise<boolean>;
}
