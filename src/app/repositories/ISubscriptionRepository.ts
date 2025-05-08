import { SubscriptionPlan } from "@prisma/client";

export interface ISubscriptionRepository {
	findAllActivePlans(): Promise<SubscriptionPlan[]> | never;

	findAll(data: {
		skip?: number;
		limit?: number;
		isActive?: boolean | null;
	}): Promise<Array<SubscriptionPlan>>;

	findActiveFreePlan(excludeId?: string): Promise<SubscriptionPlan | null>;

	findById(id: string): Promise<SubscriptionPlan | null>;

	create(data: any): Promise<SubscriptionPlan>;

	update(id: string, data: { isActive: boolean }): Promise<SubscriptionPlan>;

	delete(id: string): Promise<void>;

	count(query: { isActive: boolean | null }): Promise<number>;
}
