import express from "express";
import authRouter from "./auth";
import { sendUserVerifiedEvent } from "../kafka/kafka";
import { DependenciesInterface } from "../entities/interfaces";

const routes = (dependencies: DependenciesInterface)=>{
	const router = express.Router();

	router.use("/auth", authRouter(dependencies));
	
	// TODO: remove on production
	router.get("/kafka/new-user/:id", (req, res) => {
		const { id } = req.params;
    sendUserVerifiedEvent(id, "First-Name");
  res.sendStatus(200);
	})

	return router;
}

export default routes;