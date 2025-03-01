import express from "express";
import {
	canSubscribeController,
	getPlansController,
	getSubscriptionsController,
	subscribeController,
} from "../controllers/user/userSubscription.controller";

const userSubscriptionRouter = express.Router();

userSubscriptionRouter.get("/canSubscribe", canSubscribeController);

userSubscriptionRouter.post("/subscribe", subscribeController);

userSubscriptionRouter.get("/", getSubscriptionsController);

userSubscriptionRouter.get("/plans", getPlansController);

userSubscriptionRouter.post("/cancel", canSubscribeController);

export default userSubscriptionRouter;
