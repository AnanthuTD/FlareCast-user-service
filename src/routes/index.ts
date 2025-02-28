import express from "express";
import authRouter from "./auth";
import adminRouter from "./admin";
import { DependenciesInterface } from "../entities/interfaces";

const routes = (dependencies: DependenciesInterface)=>{
	const router = express.Router();

	router.use('/admin', adminRouter)
	router.use("/auth", authRouter(dependencies));

	return router;
}

export default routes;