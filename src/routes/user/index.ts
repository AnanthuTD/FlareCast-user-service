import { Router } from "express";
import protectedUserRoutes from "./protectedUserRoutes";
import { getPlansController } from "../../controllers/user/userSubscription.controller";
import webhookRouter from "./webhook.router";
import authRouter from "./auth";
import { DependenciesInterface } from "../../entities/interfaces";

const router = Router();

const routes = (dependencies: DependenciesInterface) => {
	/* unprotected user */
	router.use("/auth", authRouter(dependencies));
	router.get("/subscription-plans", getPlansController);
	router.use("/webhook", webhookRouter);

	/* protected user */
	router.use("/", protectedUserRoutes);

  return router
};

export default routes;
