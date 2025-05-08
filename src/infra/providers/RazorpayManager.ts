import env from "@/infra/env";
import crypto from "node:crypto";
import { IRazorpayManager } from "@/app/providers/IRazorpayManager";
import { injectable } from "inversify";

@injectable()
export class RazorpayManager implements IRazorpayManager {
	verifyWebhookSignature(
		payload: string,
		signature: string | string[] | undefined
	): boolean {
		const generatedSignature = crypto
			.createHmac("sha256", env.RAZORPAY_SECRET)
			.update(payload)
			.digest("hex");
		return generatedSignature === signature;
	}

	isEventRelevant(
		eventType: string,
		currentStatus: string | null,
		eventTimestamp: number,
		updatedAt: Date | null
	): boolean {
		const finalStates = ["completed", "cancelled", "expired"];
		const currentTimestamp = updatedAt
			? Math.floor(updatedAt.getTime() / 1000)
			: 0;
		return (
			!currentStatus ||
			!finalStates.includes(currentStatus) ||
			eventType === "subscription.updated" ||
			eventTimestamp > currentTimestamp
		);
	}
}
