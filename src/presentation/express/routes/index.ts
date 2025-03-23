import express from "express";
import interServiceRoutes from "./inter-service";
import userRoutes from "./user";

const router = express.Router();

/* interservice */
router.use("/services", interServiceRoutes);

/* user */
router.use("/", userRoutes);

export default router;
