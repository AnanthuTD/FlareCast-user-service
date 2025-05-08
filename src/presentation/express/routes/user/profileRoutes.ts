import express, { Request, Response } from "express";
import { uploadMiddleware } from "../../middlewares/multerMiddleware";
import { expressAdapter } from "@/presentation/adapters/express";
import container from "@/infra/di-container";
import { TOKENS } from "@/app/tokens";

const profileRoutes = express.Router();

const userProfileController = container.get(TOKENS.GetUserProfileController);
const updateProfileController = container.get(TOKENS.UpdateProfileController);

/**
 * Endpoint to fetch user profile (requires authentication).
 */
profileRoutes.get("/", async (req: Request, res: Response) => {
	const httpResponse = await expressAdapter(req, userProfileController);
	res.status(httpResponse.statusCode).json(httpResponse.body);
});

/**
 * Endpoint to update user profile (requires authentication).
 */
profileRoutes.put(
	"/update",
	uploadMiddleware,
	async (req: Request, res: Response) => {
		const httpResponse = await expressAdapter(req, updateProfileController);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
);

export default profileRoutes;
