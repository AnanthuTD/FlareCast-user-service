import express from "express";
import authRouter from "./auth";
import adminRouter from "./admin";
import { DependenciesInterface } from "../entities/interfaces";
import protectedUserRoutes from "./protectedUserRoutes";
import { getPlansController } from "../controllers/user/userSubscription.controller";

const routes = (dependencies: DependenciesInterface) => {
	const router = express.Router();

	router.use("/admin", adminRouter);
	router.use("/auth", authRouter(dependencies));

	router.get("/subscription-plans", getPlansController);
	router.use("/", protectedUserRoutes);

	return router;
};

export default routes;
