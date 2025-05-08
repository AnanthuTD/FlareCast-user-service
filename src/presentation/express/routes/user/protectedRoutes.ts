import express from "express";
import profileRoutes from "./profileRoutes";
import { limitsRoutes } from "./limitsRoutes";


/**
 * Router for handling protected user routes.
 */
const protectedUserRoutes = express.Router();

/**
 * User profile-related routes (protected).
 */
protectedUserRoutes.use("/profile", profileRoutes);

/**
 * Limits-related routes (protected).
 */
protectedUserRoutes.use("/limits", limitsRoutes);

export { protectedUserRoutes };
