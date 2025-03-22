import express, { Request, Response } from "express";
import Container from "typedi";
import { GetUserProfileController } from "@/presentation/http/controllers/user/GetProfile";
import { UpdateProfileController } from "@/presentation/http/controllers/user/UpdateProfile";
import { uploadMiddleware } from "../../middlewares/multer.middleware";
import { expressAdapter } from "@/presentation/adapters/express";

const profileRoutes = express.Router();

const userProfileController = Container.get(GetUserProfileController);
const updateProfileController = Container.get(UpdateProfileController);

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
