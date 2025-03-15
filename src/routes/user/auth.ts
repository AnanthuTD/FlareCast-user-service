import express from "express";
import passport from "passport";
import { DependenciesInterface } from "../../entities/interfaces";
import { userControllers } from "../../controllers";
import Container from "typedi";
import { RefreshTokenController } from "../../controllers/user/refreshToken.controller";

export = (dependencies: DependenciesInterface) => {
	const {
		userLoginController,
		userExistController,
		googleSignInController,
		// refreshTokenController,
		userLogoutController,
		userSignupController,
		electronPostLoginController,
		checkIsAuthenticatedController,
	} = userControllers(dependencies);

	const refreshTokenController = Container.get(RefreshTokenController);

	const router = express.Router();

	router.get("/user-exist", userExistController);
	router.post("/sign-up", userSignupController);
	router.post(
		"/sign-in",
		passport.authenticate("local", { session: false }),
		userLoginController
	);
	router.post("/google-sign-in", googleSignInController);
	router.get("/refresh-token", refreshTokenController.handler);
	router.post("/logout", userLogoutController);
	router.post("/post-login", electronPostLoginController);

	router.get(
		"/check-authentication",
		passport.authenticate("jwt", { session: false }),
		checkIsAuthenticatedController
	);

	return router;
};
