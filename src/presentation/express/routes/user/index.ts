import { Router } from "express";
import authRoutes from "./authRoutes";
import { protectedUserRoutes } from "./protectedRoutes";

/**
 * Main router for combining all route modules.
 */
const userRouter = Router();

/**
 * Authentication-related routes (public and protected).
 */
userRouter.use("/auth", authRoutes);

userRouter.use("/", protectedUserRoutes);

export default userRouter;
