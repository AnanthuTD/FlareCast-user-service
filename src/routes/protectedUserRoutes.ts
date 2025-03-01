import express from "express";
import userSubscriptionRouter from "./userSubscriptionRouter";
import passport from "passport";

const protectedUserRoutes = express.Router();

protectedUserRoutes.use(passport.authenticate("jwt", { session: false }));

protectedUserRoutes.use("/subscriptions", userSubscriptionRouter);

export default protectedUserRoutes;
