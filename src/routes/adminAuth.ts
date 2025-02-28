import express from "express";
import adminSignInController from "../controllers/admin/adminSignIn.controller";
import { AdminRefreshTokenController } from "../controllers/admin/adminRefreshToken.controller";
import Container from "typedi";
import { createAdminGoogleSignInHandler } from "../controllers/admin/adminSignInGoogle.controller";
import AdminLogoutController from "../controllers/admin/adminLogout.controller";

const adminAuthRouter = express.Router();
const refreshTokenController = Container.get(AdminRefreshTokenController);
const adminLogoutController = Container.get(AdminLogoutController);

adminAuthRouter.post("/sign-in", adminSignInController);
adminAuthRouter.post("/google-sign-in", createAdminGoogleSignInHandler());
adminAuthRouter.get("/refresh-token", refreshTokenController.handler);
adminAuthRouter.post("/logout", adminLogoutController.execute);

export default adminAuthRouter;
