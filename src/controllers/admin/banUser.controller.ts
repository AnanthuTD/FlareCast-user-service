import { Request, Response, NextFunction, RequestHandler } from "express";
import Container, { Service, Inject } from "typedi";
import { Prisma } from "@prisma/client";
import { UserRepository } from "../../repositories/userRepository";

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
        return res.status(400).json({ message: "isBanned must be a boolean" });
      }

      // Update user ban status
      const updatedUser = await this.userRepository.updateUserBanStatus(id, isBanned);

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
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
        return res.status(404).json({ message: "User not found" });
      }
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

export default Container.get(BanUserController).banUser;