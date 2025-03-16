import { RequestHandler } from "express";
import { Inject } from "typedi";
import { UserRepository } from "../../repositories/userRepository";

export class InsightsController {
	constructor(
		@Inject(() => UserRepository)
		private userRepository: UserRepository
	) {}

	userInsights: RequestHandler = async (req, res) => {
		const userId = req.params.userId;
		

		res.json({ message: "User insights" });
	};
}
