import { injectable, inject } from "inversify";
import { TOKENS } from "@/app/tokens";
import { IUsersRepository } from "@/app/repositories/IUsersRepository";
import { ResponseDTO } from "@/domain/dtos/Response";
import { UserExistDTO } from "@/domain/dtos/User/UserExistDTO";
import { UserExistErrorType } from "@/domain/enums/user/UserExistErrorType";
import { IUserExistUseCase } from "../IUserExistUseCase";
import { Email } from "@/domain/valueObjects/email";
import { logger } from "@/infra/logger";

@injectable()
export class UserExistUseCase implements IUserExistUseCase {
  constructor(
    @inject(TOKENS.UserRepository)
    private readonly usersRepository: IUsersRepository
  ) {}

  async execute(dto: UserExistDTO): Promise<ResponseDTO> {
    try {
      // Validate the email format using the Email value object
      let email: Email;
      try {
        email = new Email(dto.email);
      } catch (err) {
        logger.warn("Invalid email format:", dto.email);
        return {
          success: false,
          data: { error: UserExistErrorType.InvalidEmail },
        };
      }

      // Check if the user exists
      const exists = await this.usersRepository.userExists(email.address);
      return {
        success: true,
        data: { exists },
      };
    } catch (err: any) {
      logger.error("Error checking if user exists:", err);
      return {
        success: false,
        data: { error: err.message },
      };
    }
  }
}