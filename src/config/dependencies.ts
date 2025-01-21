import {
	DependenciesInterface,
	RepositoryInterface,
	UseCasesInterface,
} from "../entities/interfaces";
import * as userRepository from "../repositories/userRepository";
import * as userUseCase from "../usecases/user";

const repository: RepositoryInterface = {
	userRepository,
};

const useCases: UseCasesInterface = {
	user: userUseCase,
};

export default {
	useCases,
	repository,
} as DependenciesInterface;
