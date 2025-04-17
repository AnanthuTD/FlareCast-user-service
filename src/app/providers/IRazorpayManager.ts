export interface IRazorpayManager {
	verifyWebhookSignature(
		payload: string,
		signature: string | string[] | undefined
	): boolean;

	isEventRelevant(
		eventType: string,
		currentStatus: string | null,
		eventTimestamp: number,
		updatedAt: Date | null
	): boolean;
}
