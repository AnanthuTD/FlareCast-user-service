import express from "express";
import interServiceRoutes from "./inter-service";
import userRoutes from "./user";
import adminRoutes from "./admin";

const router = express.Router();

/* interservice */
router.use("/services", interServiceRoutes);

router.use("/admin", adminRoutes);

/* user */
router.use("/", userRoutes);

export default router;
