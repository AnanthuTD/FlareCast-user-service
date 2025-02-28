import express from "express";
import adminProfileController from "../controllers/admin/adminProfile.controller";
import authMiddleware from "../middlewares/auth.middleware";
import getPaginatedUsers from "../controllers/admin/getUsers.controller";
import banUserController from "../controllers/admin/banUser.controller";
import subscriptionRoutes from './subscriptionRoutes'

const adminProtectedRoute = express.Router();
adminProtectedRoute.use(authMiddleware);

adminProtectedRoute.get("/profile", adminProfileController);
adminProtectedRoute.get("/users", getPaginatedUsers);
adminProtectedRoute.put("/users/:id/ban", banUserController);
adminProtectedRoute.use('/subscription-plans', subscriptionRoutes)

export default adminProtectedRoute;
