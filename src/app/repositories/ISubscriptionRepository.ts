import {
	SubscriptionPlan
} from "@prisma/client";

export interface ISubscriptionRepository {
  findById(id: string): Promise<SubscriptionPlan | null | never>;
  findAllActivePlans(): Promise<SubscriptionPlan[]> | never;
}