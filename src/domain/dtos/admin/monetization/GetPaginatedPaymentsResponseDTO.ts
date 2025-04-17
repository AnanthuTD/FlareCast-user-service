export interface GetPaginatedPaymentsResponseDTO {
	data: {
		id: string;
		userId: string;
		planId: string;
		status: string;
		createdAt: Date;
		updatedAt: Date;
		cancelledAt: Date;
		remainingCount: number;
		razorpaySubscriptionId: string;
		amount: number;
		plan: { name: string };
		user: { email: string };
	}[];
	page: number;
	limit: number;
}
