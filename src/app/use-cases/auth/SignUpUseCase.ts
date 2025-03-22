import { Email } from "@/domain/valueObjects/email";
import { ICreateUserRequestDTO } from "@/domain/dtos/User/CreateUser";
import { User } from "@/domain/entities/User";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { EventService } from "@/app/services/EventService";
import { PasswordHasher } from "@/infra/providers/PasswordHasher";
import { Inject } from "typedi";
import { TOKENS } from "@/app/tokens";

export class SignUpUseCase {
	constructor(
		@Inject(TOKENS.UserRepository) private usersRepository: IUsersRepository,
		@Inject(TOKENS.PasswordHasher) private readonly hashPassword: PasswordHasher,
		@Inject(TOKENS.EventService) private readonly eventService: EventService
	) {}

	async execute(data: ICreateUserRequestDTO): Promise<User> {
		// Transform input into domain objects
		const email = new Email(data.email);

		// Check if user exists
		const existingUser = await this.usersRepository.findByEmail(data.email);
		if (existingUser) {
			throw new Error("User already exists");
		}

		const hashedPassword = await this.hashPassword.hashPassword(data.password);

		// Create user with default values from your schema
		const user = User.create({
			email,
			firstName: data.firstName,
			lastName: data.lastName || null,
			hashedPassword,
			isVerified: false,
			isBanned: false,
		});

		// Persist user
		const createdUser = await this.usersRepository.create(user);

		await this.eventService.publishUserCreatedEvent({
			userId: createdUser.id!,
			email: createdUser.email.address,
		});

		return createdUser;
	}
}
