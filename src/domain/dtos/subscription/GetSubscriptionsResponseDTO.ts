import { Subscription } from "@/domain/entities/Subscription";

export interface GetSubscriptionsResponseDTO extends Subscription {
 /*  subscriptionId: string;
  userId: string;
  planId: string;
  status: string;
  razorpaySubscriptionId: string;
  startDate: string;
  endDate: string; */
  razorpayKeyId: string;
}