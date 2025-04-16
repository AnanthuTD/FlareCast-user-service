import { TOKENS } from "@/app/tokens";
import container from "@/infra/di-container";
import { expressAdapter } from "@/presentation/adapters/express";
import { Router, Request, Response } from "express";

/**
 * Router for handling limits-related routes.
 */
const limitsRoutes = Router();

// Fetch controllers using TypeDI
const uploadVideoPermissionController = container.get(TOKENS.UserVideoController
);
const getWorkspaceLimitController = container.get(TOKENS.GetWorkspaceLimitController);
const getMemberLimitController = container.get(TOKENS.GetMemberLimitController);

/**
 * Endpoint to check video upload permissions for the authenticated user (requires authentication).
 */
limitsRoutes.get(
	"/upload-permission",
	async (req: Request, res: Response) => {
		const httpResponse = await expressAdapter(
			req,
			uploadVideoPermissionController
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
