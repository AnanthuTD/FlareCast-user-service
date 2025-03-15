import express from "express";
import {
	getPlansController,
	createPlanController,
  togglePlanController,
} from "../../controllers/admin/subscriptionPlan.controller"; 

const router = express.Router();

// Fetch all subscription plans
router.get("/", getPlansController);

// Create a new subscription plan
router.post("/", createPlanController);

// Delete a subscription plan by planId
router.patch("/:id/toggle", togglePlanController); 

export default router;
