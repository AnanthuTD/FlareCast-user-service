import express from "express";
import userSubscriptionRouter from "./userSubscriptionRouter";
import passport from "passport";
import profileRoutes from "./userProfile.route";

const protectedUserRoutes = express.Router();

protectedUserRoutes.use(passport.authenticate("jwt", { session: false }));

protectedUserRoutes.use("/subscriptions", userSubscriptionRouter);

protectedUserRoutes.use("/profile", profileRoutes);

export default protectedUserRoutes;
