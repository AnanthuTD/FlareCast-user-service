import express from "express";
import {
	updateProfileController,
	uploadMiddleware,
} from "../controllers/user/userProfile.controller";

const router = express.Router();

router.put("/update", uploadMiddleware, updateProfileController);

export default router;
