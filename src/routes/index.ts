import express from "express";
import adminRouter from "./admin";
import { DependenciesInterface } from "../entities/interfaces";

import interServiceRoutes from "./inter-service";
import userRoutes from "./user";

const routes = (dependencies: DependenciesInterface) => {
	const router = express.Router();

	/* interservice */
	router.use("/services", interServiceRoutes);

	/* admin */
	router.use("/admin", adminRouter);

	/* user */
	router.use("/", userRoutes(dependencies));

	return router;
};

export default routes;
