import express from "express";
import passport from "passport";
import { DependenciesInterface } from "../entities/interfaces";
import { userControllers } from "../controllers";

export = (dependencies: DependenciesInterface) => {
	const {
		userLoginController,
		userExistController,
		googleSignInController,
		refreshTokenController,
		userLogoutController,
		userSignupController,
		electronPostLoginController,
	} = userControllers(dependencies);

	const router = express.Router();

	router.get("/user-exist", userExistController);
	router.post("/sign-up", userSignupController);
	router.post(
		"/sign-in",
		passport.authenticate("local", { session: false }),
		userLoginController
	);
	router.post("/google-sign-in", googleSignInController);
	router.get("/refresh-token", refreshTokenController);
	router.post("/logout", userLogoutController);
	router.post("/post-login", electronPostLoginController);

	return router;
};
