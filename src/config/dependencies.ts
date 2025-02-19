import {
	DependenciesInterface,
	RepositoryInterface,
	UseCasesInterface,
} from "../entities/interfaces";
import * as userRepository from "../repositories/userRepository";
import { RefreshTokenRepository } from "../repositories/refreshToken.repository";
import * as userUseCase from "../usecases/user";

const repository: RepositoryInterface = {
	userRepository,
	refreshTokenRepository: new RefreshTokenRepository(),
};

const useCases: UseCasesInterface = {
	user: userUseCase,
};

export default {
	useCases,
	repository,
} as DependenciesInterface;
