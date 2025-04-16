import express from "express";
import interServiceRoutes from "./inter-service";
import userRoutes from "./user";
import adminRoutes from "./admin";
import { webhookRoutes } from "./webhook.router";
import { subscriptionRoutes } from "./subscriptions";
import { extractUserInfo } from "../middlewares/extractUserDataFromHeader";

const router = express.Router();

/* interservice */
router.use("/services", interServiceRoutes);

router.use(extractUserInfo)

router.use("/admin", adminRoutes);

/**
 * Webhook-related routes (public).
 */
router.use("/webhook", webhookRoutes);

router.use("/subscriptions", subscriptionRoutes);

/* user */
router.use("/users", userRoutes);

export default router;
