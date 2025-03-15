import express from "express";
import userSubscriptionRouter from "./userSubscriptionRouter";
import passport from "passport";
import profileRoutes from "./userProfile.route";
import { limitsController } from "../../controllers/user/limits.controller";

const protectedUserRoutes = express.Router();

protectedUserRoutes.use(passport.authenticate("jwt", { session: false }));

protectedUserRoutes.use("/subscriptions", userSubscriptionRouter);

protectedUserRoutes.use("/profile", profileRoutes);

protectedUserRoutes.get(
	"/upload-permission",
	limitsController.userUploadVideoPermission
);

export default protectedUserRoutes;
