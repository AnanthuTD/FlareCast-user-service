export interface SubscriptionPlanDTO {
  id: string;
  name: string;
  price: number;
  active?: boolean;
}

export interface GetPlansResponseDTO {
  plans: SubscriptionPlanDTO[];
}