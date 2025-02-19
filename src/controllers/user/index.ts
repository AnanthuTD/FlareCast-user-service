import { DependenciesInterface } from "../../entities/interfaces";
import checkIsAuthenticatedController from "./checkIsAuthenticated.controller";
import electronPostLoginController from "./electronPostLogin.controller";
import googleSignInController from "./googleSignIn.controller";
import refreshTokenController from "./refreshToken.controller";
import userExistController from "./userExist.controller";
import userLoginController from "./userLogin.controller";
import userLogoutController from "./userLogout.controller";
import userSignupController from "./userSignup.controller";

export = (dependencies: DependenciesInterface) => {
	return {
		userLoginController: userLoginController(dependencies),
		googleSignInController: googleSignInController(dependencies),
		userExistController: userExistController(dependencies),
		userSignupController: userSignupController(dependencies),
		userLogoutController: userLogoutController(dependencies),
		// refreshTokenController: refreshTokenController(dependencies),
		electronPostLoginController: electronPostLoginController(dependencies),
		checkIsAuthenticatedController: checkIsAuthenticatedController(dependencies)
	};
};
