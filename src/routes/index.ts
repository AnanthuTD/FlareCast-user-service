import express from "express";
import authRouter from "./auth";
import { DependenciesInterface } from "../entities/interfaces";

const routes = (dependencies: DependenciesInterface)=>{
	const router = express.Router();

	router.use("/auth", authRouter(dependencies));

	return router;
}

export default routes;