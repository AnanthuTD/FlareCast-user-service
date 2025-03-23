import { RequestHandler } from "express";
import { Inject } from "typedi";
import { UserRepository } from "../../repositories/userRepository";

@injectable()
export class InsightsController {
	constructor(
		@inject(() => UserRepository)
		private userRepository: UserRepository
	) {}

	userInsights: RequestHandler = async (req, res) => {
		const userId = req.params.userId;
		

		res.json({ message: "User insights" });
	};
}
