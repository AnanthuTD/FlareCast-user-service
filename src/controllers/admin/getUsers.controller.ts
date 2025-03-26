import { Request, Response, NextFunction, RequestHandler } from "express";
import { Service, Inject, Container } from "typedi";
import { UserRepository } from "../../repositories/userRepository";
import HttpStatusCodes from "../../common/HttpStatusCodes";

@Service()
@injectable()
export class UsersController {
  constructor(
    @inject(() => UserRepository)
    private userRepository: UserRepository
  ) {}

  getPaginatedUsers: RequestHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const searchQuery = (req.query.q as string) || "";
      const includeBanned = req.query.includeBanned === "true"; // Query param ?includeBanned=true

      if (page < 1 || limit < 1) {
        return res.status(HttpStatusCodes.BAD_REQUEST).json({ message: "Page and limit must be positive integers" });
      }

      const { users, total, totalPages, currentPage } =
        await this.userRepository.findPaginatedUsers({
          page,
          limit,
          searchQuery,
          includeBanned,
        });

      return res.status(HttpStatusCodes.OK).json({
        success: true,
        data: {
          users,
          pagination: {
            total,
            totalPages,
            currentPage,
            limit,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching paginated users:", error);
      return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
  };
}

export default Container.get(UsersController).getPaginatedUsers;