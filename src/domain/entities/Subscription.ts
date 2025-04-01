import { injectable } from "inversify";

export enum SubscriptionStatus {
  CREATED = "created",
  AUTHENTICATED = "authenticated",
  ACTIVE = "active",
  PENDING = "pending",
  HALTED = "halted",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  EXPIRED = "expired",
  PAUSED = "paused",
  RESUMED = "resumed",
  CHARGED = "charged",
}

export interface SubscriptionProps {
  id?: string;
  userId: string;
  planId: string;
  razorpaySubscriptionId: string;
  status: SubscriptionStatus;
  remainingCount: number;
  paidCount: number;
  totalCount: number;
  amount: number;
  shortUrl?: string | null;
  notes?: Record<string, string> | null;
  startDate: Date;
  endDate?: Date | null;
  endedAt?: Date | null;
  currentStart?: Date | null;
  currentEnd?: Date | null;
  chargeAt?: Date | null;
  cancelledAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Subscription {
  private _id?: string;
  private _userId: string;
  private _planId: string;
  private _razorpaySubscriptionId: string;
  private _status: SubscriptionStatus;
  private _remainingCount: number;
  private _paidCount: number;
  private _totalCount: number;
  private _amount: number;
  private _shortUrl?: string | null;
  private _notes?: Record<string, string> | null;
  private _startDate: Date;
  private _endDate?: Date | null;
  private _endedAt?: Date | null;
  private _currentStart?: Date | null;
  private _currentEnd?: Date | null;
  private _chargeAt?: Date | null;
  private _cancelledAt?: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: SubscriptionProps) {
    this._id = props.id;
    this._userId = props.userId;
    this._planId = props.planId;
    this._razorpaySubscriptionId = props.razorpaySubscriptionId;
    this._status = props.status;
    this._remainingCount = props.remainingCount;
    this._paidCount = props.paidCount;
    this._totalCount = props.totalCount;
    this._amount = props.amount;
    this._shortUrl = props.shortUrl;
    this._notes = props.notes;
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._endedAt = props.endedAt;
    this._currentStart = props.currentStart;
    this._currentEnd = props.currentEnd;
    this._chargeAt = props.chargeAt;
    this._cancelledAt = props.cancelledAt;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();

    // Enforce business rules
    this.validate();
  }

  static create(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }

  // Business rule: Validate the subscription
  private validate(): void {
    if (!this._userId) {
      throw new Error("Subscription must have a valid userId");
    }
    if (!this._planId) {
      throw new Error("Subscription must have a valid planId");
    }
    if (!this._razorpaySubscriptionId) {
      throw new Error("Subscription must have a Razorpay subscription ID");
    }
    if (this._remainingCount < 0) {
      throw new Error("Remaining count cannot be negative");
    }
    if (this._paidCount < 0) {
      throw new Error("Paid count cannot be negative");
    }
    if (this._totalCount < 0) {
      throw new Error("Total count cannot be negative");
    }
    if (this._amount < 0) {
      throw new Error("Amount cannot be negative");
    }
    if (this._endDate && this._endDate < this._startDate) {
      throw new Error("End date cannot be earlier than start date");
    }
  }

  // Method to cancel the subscription
  cancel(): void {
    if (this._status === SubscriptionStatus.EXPIRED || this._status === SubscriptionStatus.COMPLETED) {
      throw new Error("Cannot cancel an expired or completed subscription");
    }
    this._status = SubscriptionStatus.CANCELLED;
    this._cancelledAt = new Date();
    this._endDate = new Date();
    this._updatedAt = new Date();
  }

  // Method to mark as active
  activate(): void {
    if (this._status !== SubscriptionStatus.CREATED && this._status !== SubscriptionStatus.AUTHENTICATED) {
      throw new Error("Subscription must be in created or authenticated state to activate");
    }
    this._status = SubscriptionStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  // Method to record a payment
  recordPayment(): void {
    if (this._status !== SubscriptionStatus.ACTIVE) {
      throw new Error("Subscription must be active to record a payment");
    }
    this._paidCount += 1;
    this._remainingCount = Math.max(0, this._remainingCount - 1);
    this._updatedAt = new Date();
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get userId(): string {
    return this._userId;
  }

  get planId(): string {
    return this._planId;
  }

  get razorpaySubscriptionId(): string {
    return this._razorpaySubscriptionId;
  }

  get status(): SubscriptionStatus {
    return this._status;
  }

  get remainingCount(): number {
    return this._remainingCount;
  }

  get paidCount(): number {
    return this._paidCount;
  }

  get totalCount(): number {
    return this._totalCount;
  }

  get amount(): number {
    return this._amount;
  }

  get shortUrl(): string | null | undefined {
    return this._shortUrl;
  }

  get notes(): Record<string, string> | null | undefined {
    return this._notes;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get endDate(): Date | null | undefined {
    return this._endDate;
  }

  get endedAt(): Date | null | undefined {
    return this._endedAt;
  }

  get currentStart(): Date | null | undefined {
    return this._currentStart;
  }

  get currentEnd(): Date | null | undefined {
    return this._currentEnd;
  }

  get chargeAt(): Date | null | undefined {
    return this._chargeAt;
  }

  get cancelledAt(): Date | null | undefined {
    return this._cancelledAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}