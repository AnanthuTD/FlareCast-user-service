import { Router, Request, Response } from "express";
import container from "@/infra/di-container";
import { TOKENS } from "@/app/tokens";
import { expressAdapter } from "@/presentation/adapters/express";
import { IController } from "@/presentation/http/controllers/IController";
import { setAuthCookies } from "../../setAuthCookies";

const adminAuthRouter = Router();
const adminRefreshTokenController = container.get<IController>(
	TOKENS.AdminRefreshTokenController
);
const adminLogoutController = container.get<IController>(
	TOKENS.AdminLogoutController
);
const adminSignInController = container.get<IController>(
	TOKENS.AdminSignInController
);
const adminGoogleSignInController = container.get<IController>(
	TOKENS.AdminGoogleSignInController
);

adminAuthRouter.post("/sign-in", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, adminSignInController);
	setAuthCookies(res, adapter.body.accessToken, adapter.body.refreshToken);
	res.status(adapter.statusCode).json(adapter.body);
});
adminAuthRouter.post("/google-sign-in", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, adminGoogleSignInController);
	setAuthCookies(res, adapter.body.accessToken, adapter.body.refreshToken);
	res.status(adapter.statusCode).json(adapter.body);
});
adminAuthRouter.post("/refresh-token", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, adminRefreshTokenController);
	setAuthCookies(res, adapter.body.accessToken, adapter.body.refreshToken);
	res.status(adapter.statusCode).json(adapter.body);
});
adminAuthRouter.post("/logout", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, adminLogoutController);
	res.clearCookie("refreshToken");
	res.clearCookie("accessToken");
	res.status(adapter.statusCode).json(adapter.body);
});

export default adminAuthRouter;
