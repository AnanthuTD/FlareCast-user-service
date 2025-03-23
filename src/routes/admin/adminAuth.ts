import express from "express";
import adminSignInController from "../../controllers/admin/adminSignIn.controller";
import { AdminRefreshTokenController } from "../../controllers/admin/adminRefreshToken.controller";
import { createAdminGoogleSignInHandler } from "../../controllers/admin/adminSignInGoogle.controller";
import AdminLogoutController from "../../controllers/admin/adminLogout.controller";
import container from "@/infra/di-container";
import { TOKENS } from "@/app/tokens";

const adminAuthRouter = express.Router();
const refreshTokenController = container.get(TOKENS.);
const adminLogoutController = container.get(TOKENS.AdminLogoutController);

adminAuthRouter.post("/sign-in", adminSignInController);
adminAuthRouter.post("/google-sign-in", createAdminGoogleSignInHandler());
adminAuthRouter.get("/refresh-token", refreshTokenController.handler);
adminAuthRouter.post("/logout", adminLogoutController.execute);

export default adminAuthRouter;
