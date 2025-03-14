import express from "express";
import authRouter from "./auth";
import adminRouter from "./admin";
import { DependenciesInterface } from "../entities/interfaces";
import protectedUserRoutes from "./protectedUserRoutes";
import { getPlansController } from "../controllers/user/userSubscription.controller";
import webhookRouter from "./webhook.router";
import interServiceRoutes from "./inter-service";

const routes = (dependencies: DependenciesInterface) => {
	const router = express.Router();

	router.use('/services', interServiceRoutes)

	router.use("/admin", adminRouter);
	router.use("/auth", authRouter(dependencies));
	
	router.get("/subscription-plans", getPlansController);
	router.use("/webhook", webhookRouter)
	router.use("/", protectedUserRoutes);

	return router;
};

export default routes;
