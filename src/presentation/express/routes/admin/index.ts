import express from "express";
import adminAuthRouter from "./authRoutes";
import adminProtectedRoute from "./protectedRoutes";

const adminRoutes = express.Router();

adminRoutes.use("/auth", adminAuthRouter);
adminRoutes.use("/", adminProtectedRoute)

export default adminRoutes;
