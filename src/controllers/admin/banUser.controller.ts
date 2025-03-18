import { Request, Response, NextFunction, RequestHandler } from "express";
import Container, { Service, Inject } from "typedi";
import { Prisma } from "@prisma/client";
import { UserRepository } from "../../repositories/userRepository";
import HttpStatusCodes from "../../common/HttpStatusCodes";

@Service()
export class BanUserController {
  constructor(
    @Inject(() => UserRepository)
    private userRepository: UserRepository
  ) {}

  banUser: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isBanned } = req.body;

      // Validate input
      if (typeof isBanned !== "boolean") {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "isBanned must be a boolean" });
      }

      // Update user ban status
      const updatedUser = await this.userRepository.updateUserBanStatus(id, isBanned);

      if (!updatedUser) {
        return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "User not found" });
      }

      return res.status(HttpStatusCodes.OK).json({
        success: true,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          isBanned: updatedUser.isBanned,
          createdAt: updatedUser.createdAt,
        },
      });
    } catch (error) {
      console.error("Error banning user:", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return res.status(HttpStatusCodes.NOT_FOUND).json({ message: "User not found" });
      }
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
  };
}

export default Container.get(BanUserController).banUser;