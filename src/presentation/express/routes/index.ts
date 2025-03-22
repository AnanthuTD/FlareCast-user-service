import express from "express";
import interServiceRoutes from "./inter-service";
import authRoutes from "./user/authenticate";

const router = express.Router();

/* interservice */
router.use("/services", interServiceRoutes);

/* user */
router.use("/", authRoutes);

export default router;
