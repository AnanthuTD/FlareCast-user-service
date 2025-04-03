export interface IBlacklistRefreshTokenUseCase {
	execute(token: string, expiresAt: number): Promise<void>;
}