import express from "express";
import adminAuthRouter from "./adminAuth";
import adminProtectedRoute from "./adminProtected";

const adminRoutes = express.Router();

adminRoutes.use("/auth", adminAuthRouter);
adminRoutes.use("/", adminProtectedRoute)

export default adminRoutes;
