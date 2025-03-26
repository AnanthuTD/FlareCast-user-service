import express from "express";
import profileRoutes from "./userProfile.route";
import { limitsRoutes } from "./limits-routes";
import { authenticateUserMiddleware } from "../../middlewares/authMiddleware";
import { subscriptionRoutes } from "./userSubscriptionRouter";


/**
 * Router for handling protected user routes.
 */
const protectedUserRoutes = express.Router();

// Apply authentication middleware to all routes under this router
protectedUserRoutes.use(authenticateUserMiddleware);

/**
 * Subscription-related routes (protected).
 */
protectedUserRoutes.use("/subscriptions", subscriptionRoutes);

/**
 * User profile-related routes (protected).
 */
protectedUserRoutes.use("/profile", profileRoutes);

/**
 * Limits-related routes (protected).
 */
protectedUserRoutes.use("/limits", limitsRoutes);

export { protectedUserRoutes };
