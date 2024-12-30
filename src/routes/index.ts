import express from "express";
import authRouter from "./auth";
import { notifyCollaborationService } from "../services/kafka";

const router = express.Router();

router.use("/auth", authRouter);
router.get("/kafka/new-user/:id", (req, res) => {
	const { id } = req.params;
	notifyCollaborationService(id);
  res.send('success')
});

export default router;
