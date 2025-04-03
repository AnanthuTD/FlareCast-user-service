import { Router, Request, Response } from "express";
import subscriptionRoutes from "./subscriptionRoutes";
import container from "@/infra/di-container";
import { IController } from "@/presentation/http/controllers/IController";
import { TOKENS } from "@/app/tokens";
import { expressAdapter } from "@/presentation/adapters/express";
import promotionalRoutes from "./promotionalVideoRoutes";
import { authenticateAdminMiddleware } from "../../middlewares/authAdminMiddleware";
import reportRoutes from "./reportRoutes";

const adminProtectedRoute = Router();
adminProtectedRoute.use(authenticateAdminMiddleware);

const getAdminProfileController = container.get<IController>(
	TOKENS.GetAdminProfileController
);
const getPaginatedUsersController = container.get<IController>(
	TOKENS.GetPaginatedUsersController
);
const banUserController = container.get<IController>(TOKENS.BanUserController);
const getPaymentsController = container.get<IController>(
	TOKENS.GetPaginatedPaymentsController
);
const getSubscriptionStatus = container.get<IController>(
	TOKENS.GetSubscriptionStatusController
);

adminProtectedRoute.get("/profile", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, getAdminProfileController);
	res.status(adapter.statusCode).json(adapter.body);
});

adminProtectedRoute.get("/users", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, getPaginatedUsersController);
	res.status(adapter.statusCode).json(adapter.body);
});

adminProtectedRoute.put(
	"/users/:id/ban",
	async (req: Request, res: Response) => {
		const adapter = await expressAdapter(req, banUserController);
		res.status(adapter.statusCode).json(adapter.body);
	}
);

/* 
params: {
	page: number;
	limit: number;
	status: string;
}
*/
adminProtectedRoute.get("/payments", async (req: Request, res: Response) => {
	const adapter = await expressAdapter(req, getPaymentsController);
	res.status(adapter.statusCode).json(adapter.body);
});

adminProtectedRoute.get(
	"/payment-status",
	async (req: Request, res: Response) => {
		const adapter = await expressAdapter(req, getSubscriptionStatus);
		res.status(adapter.statusCode).json(adapter.body);
	}
);

adminProtectedRoute.use("/subscription-plans", subscriptionRoutes);
adminProtectedRoute.use("/promotional-videos", promotionalRoutes);
adminProtectedRoute.use('/sales', reportRoutes)

export default adminProtectedRoute;
