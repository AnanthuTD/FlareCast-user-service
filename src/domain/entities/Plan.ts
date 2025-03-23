import { injectable } from "inversify";

export enum PlanType {
  FREE = "free",
  PAID = "paid",
}

export enum Period {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  YEARLY = "yearly",
}

export interface PlanProps {
  id?: string;
  type: PlanType;
  planId?: string | null; // Razorpay plan ID
  name: string;
  price: number;
  interval?: number | null;
  period?: Period | null;
  maxRecordingDuration: number;
  hasAiFeatures: boolean;
  hasAdvancedEditing: boolean;
  maxMembers?: number | null;
  maxVideoCount?: number | null;
  maxWorkspaces?: number | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

@injectable()
export class Plan {
  private _id?: string;
  private _type: PlanType;
  private _planId?: string | null;
  private _name: string;
  private _price: number;
  private _interval?: number | null;
  private _period?: Period | null;
  private _maxRecordingDuration: number;
  private _hasAiFeatures: boolean;
  private _hasAdvancedEditing: boolean;
  private _maxMembers?: number | null;
  private _maxVideoCount?: number | null;
  private _maxWorkspaces?: number | null;
  private _isActive: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: PlanProps) {
    this._id = props.id;
    this._type = props.type;
    this._planId = props.planId;
    this._name = props.name;
    this._price = props.price;
    this._interval = props.interval;
    this._period = props.period;
    this._maxRecordingDuration = props.maxRecordingDuration;
    this._hasAiFeatures = props.hasAiFeatures;
    this._hasAdvancedEditing = props.hasAdvancedEditing;
    this._maxMembers = props.maxMembers;
    this._maxVideoCount = props.maxVideoCount;
    this._maxWorkspaces = props.maxWorkspaces;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();

    // Enforce business rules
    this.validate();
  }

  static create(props: PlanProps): Plan {
    return new Plan(props);
  }

  // Business rule: Validate the plan
  private validate(): void {
    if (!this._name) {
      throw new Error("Plan must have a name");
    }
    if (this._price < 0) {
      throw new Error("Price cannot be negative");
    }
    if (this._maxRecordingDuration < 0) {
      throw new Error("Max recording duration cannot be negative");
    }
    if (this._interval && this._interval <= 0) {
      throw new Error("Interval must be positive");
    }
    if (this._maxMembers && this._maxMembers < 0) {
      throw new Error("Max members cannot be negative");
    }
    if (this._maxVideoCount && this._maxVideoCount < 0) {
      throw new Error("Max video count cannot be negative");
    }
    if (this._maxWorkspaces && this._maxWorkspaces < 0) {
      throw new Error("Max workspaces cannot be negative");
    }
  }

  // Method to deactivate the plan
  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  // Method to update the price
  updatePrice(newPrice: number): void {
    if (newPrice < 0) {
      throw new Error("Price cannot be negative");
    }
    this._price = newPrice;
    this._updatedAt = new Date();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get type(): PlanType {
    return this._type;
  }

  get planId(): string | null | undefined {
    return this._planId;
  }

  get name(): string {
    return this._name;
  }

  get price(): number {
    return this._price;
  }

  get interval(): number | null | undefined {
    return this._interval;
  }

  get period(): Period | null | undefined {
    return this._period;
  }

  get maxRecordingDuration(): number {
    return this._maxRecordingDuration;
  }

  get hasAiFeatures(): boolean {
    return this._hasAiFeatures;
  }

  get hasAdvancedEditing(): boolean {
    return this._hasAdvancedEditing;
  }

  get maxMembers(): number | null | undefined {
    return this._maxMembers;
  }

  get maxVideoCount(): number | null | undefined {
    return this._maxVideoCount;
  }

  get maxWorkspaces(): number | null | undefined {
    return this._maxWorkspaces;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}