export interface SubscriptionPlanDTO {
  id: string;
  name: string;
  price: number;
  // Add other fields as needed based on the subscription plan data
  active?: boolean; // Indicates if this plan is the user's active subscription
}

export interface GetPlansResponseDTO {
  plans: SubscriptionPlanDTO[];
  activeSubscription: {
    planId: string;
    // Add other fields as needed
  } | null;
}