import { RequestHandler } from "express";
import Container, { Inject, Service } from "typedi";
import { UserRepository } from "../../repositories/userRepository";
import { UserSubscriptionRepository } from "../../repositories/userSubscription.repository";

@Service()
export class LimitsController {
	constructor(
		@Inject()
		private userRepository: UserRepository,
		@Inject()
		private userSubscriptionRepository: UserSubscriptionRepository
	) {}

	serviceUploadVideoPermissions: RequestHandler = async (req, res, next) => {
		const userId = req.params.userId;

		try {
			const activePlan =
				await this.userSubscriptionRepository.getActiveSubscription(userId);

			if (!activePlan) {
				return res
					.status(403)
					.json({ message: "You don't have an active subscription plan!" });
			}

			const currentVideoCount = await this.userRepository.currentVideoCount(
				userId
			);

			if (activePlan.maxVideoCount === null || activePlan.maxVideoCount < 0) {
				return res.status(200).json({
					message: "User has unlimited video count",
					permission: "granted",
					maxVideoCount: null,
					totalVideoUploaded: currentVideoCount,
					aiFeature: activePlan.hasAiFeatures,
					maxRecordDuration: activePlan.maxRecordingDuration,
				});
			}

			if (activePlan.maxVideoCount <= currentVideoCount) {
				return res.status(403).json({
					message: "You've reached your maximum video upload limit!",
					permission: "denied",
					maxVideoCount: activePlan.maxVideoCount,
					totalVideoUploaded: currentVideoCount,
				});
			}

			return res.status(200).json({
				message: "You can upload more videos!",
				permission: "granted",
				maxVideoCount: activePlan.maxVideoCount,
				totalVideoUploaded: currentVideoCount,
				aiFeature: activePlan.hasAiFeatures,
				maxRecordDuration: activePlan.maxRecordingDuration,
			});
		} catch (error) {
			console.error("Error checking upload permission:", error);
			return res.status(500).json({ message: "Internal server error" });
		}
	};

	userUploadVideoPermission: RequestHandler = async (req, res, next) => {
		const userId = req.user.id;

		try {
			const activePlan =
				await this.userSubscriptionRepository.getActiveSubscription(userId);

			if (!activePlan) {
				return res
					.status(403)
					.json({ message: "You don't have an active subscription plan!" });
			}

			const currentVideoCount = await this.userRepository.currentVideoCount(
				userId
			);

			if (activePlan.maxVideoCount === null || activePlan.maxVideoCount < 0) {
				return res.status(200).json({
					message: "User has unlimited video count",
					permission: "granted",
					maxVideoCount: null,
					totalVideoUploaded: currentVideoCount,
				});
			}

			if (activePlan.maxVideoCount <= currentVideoCount) {
				return res.status(403).json({
					message: "You've reached your maximum video upload limit!",
					permission: "denied",
					maxVideoCount: activePlan.maxVideoCount,
					totalVideoUploaded: currentVideoCount,
				});
			}

			return res.status(200).json({
				message: "You can upload more videos!",
				permission: "granted",
				maxVideoCount: activePlan.maxVideoCount,
				totalVideoUploaded: currentVideoCount,
			});
		} catch (error) {
			console.error("Error checking upload permission:", error);
			return res.status(500).json({ message: "Internal server error" });
		}
	};

	getWorkspaceLimit: RequestHandler = async (req, res) => {
		const userId = req.params.userId;
		try {
			const activePlan =
				await this.userSubscriptionRepository.getActiveSubscription(userId);
			if (!activePlan) {
				return res.status(403).json({
					message: `User ${userId} don't have an active subscription plan!`,
				});
			}
			return res.status(200).json({
				message: "Workspace limit",
				limit: activePlan.maxWorkspaces,
			});
		} catch (err) {
			console.error("Error getting workspace limit:", err);
			return res.status(500).json({ message: "Internal server error" });
		}
	};

	getMemberLimit: RequestHandler = async (req, res) => {
		const userId = req.params.userId;
		try {
			const activePlan =
				await this.userSubscriptionRepository.getActiveSubscription(userId);
			if (!activePlan) {
				return res.status(403).json({
					message: `User ${userId} don't have an active subscription plan!`,
				});
			}
			return res.status(200).json({
				message: "Member limit",
				limit: activePlan.maxMembers,
			});
		} catch (err) {
			console.error("Error getting member limit:", err);
			return res.status(500).json({ message: "Internal server error" });
		}
	};
}

export const limitsController = Container.get(LimitsController);
