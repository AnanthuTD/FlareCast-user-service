import express from "express";
import adminProfileController from "../controllers/admin/adminProfile.controller";
import authMiddleware from "../middlewares/auth.middleware";

const adminProtectedRoute = express.Router();
adminProtectedRoute.use(authMiddleware);

adminProtectedRoute.get("/profile", adminProfileController);

export default adminProtectedRoute;
