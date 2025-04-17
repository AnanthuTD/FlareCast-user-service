import { SubscriptionPlan } from "@prisma/client";

export interface ISubscriptionRepository {
	findAllActivePlans(): Promise<SubscriptionPlan[]> | never;

	findAll(): Promise<Array<SubscriptionPlan>>;

	findActiveFreePlan(excludeId?: string): Promise<SubscriptionPlan | null>;

	findById(id: string): Promise<SubscriptionPlan | null>;

	create(data: any): Promise<SubscriptionPlan>;

	update(id: string, data: { isActive: boolean }): Promise<SubscriptionPlan>;

	delete(id: string): Promise<void>;
}
