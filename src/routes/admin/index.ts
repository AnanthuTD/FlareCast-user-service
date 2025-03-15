import express from "express";
import adminAuthRouter from "./adminAuth";
import adminProtectedRoute from "./adminProtected";

const router = express();

router.use("/auth", adminAuthRouter);
router.use("/", adminProtectedRoute)

export default router;
