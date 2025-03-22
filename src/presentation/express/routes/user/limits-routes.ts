import { expressAdapter } from "@/presentation/adapters/express";
import { GetMemberLimitController } from "@/presentation/http/controllers/subscription/MembersLimit";
import { GetWorkspaceLimitController } from "@/presentation/http/controllers/subscription/WorkspaceLimit";
import { UserUploadVideoPermissionController } from "@/presentation/http/controllers/user/VideoUploadPermission";
import { Router, Request, Response } from "express";
import { Container } from "typedi";

/**
 * Router for handling limits-related routes.
 */
const limitsRoutes = Router();

// Fetch controllers using TypeDI
const userUploadVideoPermissionController = Container.get(
	UserUploadVideoPermissionController
);
const getWorkspaceLimitController = Container.get(GetWorkspaceLimitController);
const getMemberLimitController = Container.get(GetMemberLimitController);

/**
 * Endpoint to check video upload permissions for the authenticated user (requires authentication).
 */
limitsRoutes.get(
	"/user-upload-permission",
	async (req: Request, res: Response) => {
		const httpResponse = await expressAdapter(
			req,
			userUploadVideoPermissionController
		);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
);

/**
 * Endpoint to fetch the workspace limit for a user (requires authentication).
 */
limitsRoutes.get(
	"/workspace-limit/:userId",
	async (req: Request, res: Response) => {
		const httpResponse = await expressAdapter(req, getWorkspaceLimitController);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
);

/**
 * Endpoint to fetch the member limit for a user (requires authentication).
 */
limitsRoutes.get(
	"/member-limit/:userId",
	async (req: Request, res: Response) => {
		const httpResponse = await expressAdapter(req, getMemberLimitController);
		res.status(httpResponse.statusCode).json(httpResponse.body);
	}
);

export { limitsRoutes };
