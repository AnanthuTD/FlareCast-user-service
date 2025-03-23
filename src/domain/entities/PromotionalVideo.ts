import { injectable } from "inversify";

export enum PromotionalVideoCategory {
  PROMOTIONAL = "PROMOTIONAL",
  NEW_FEATURE = "NEW_FEATURE",
}

export interface PromotionalVideoProps {
  id?: string;
  category: PromotionalVideoCategory;
  hidden: boolean;
  videoId: string;
  priority: number;
  startDate?: Date | null;
  endDate?: Date | null;
  title?: string | null;
  description?: string | null;
  createdBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@injectable()
export class PromotionalVideo {
  private _id?: string;
  private _category: PromotionalVideoCategory;
  private _hidden: boolean;
  private _videoId: string;
  private _priority: number;
  private _startDate?: Date | null;
  private _endDate?: Date | null;
  private _title?: string | null;
  private _description?: string | null;
  private _createdBy: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: PromotionalVideoProps) {
    this._id = props.id;
    this._category = props.category;
    this._hidden = props.hidden;
    this._videoId = props.videoId;
    this._priority = props.priority;
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._title = props.title;
    this._description = props.description;
    this._createdBy = props.createdBy;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();

    // Enforce business rules
    this.validate();
  }

  static create(props: PromotionalVideoProps): PromotionalVideo {
    return new PromotionalVideo(props);
  }

  // Business rule: Validate the promotional video
  private validate(): void {
    if (!this._videoId) {
      throw new Error("PromotionalVideo must have a valid videoId");
    }
    if (this._priority < 0) {
      throw new Error("Priority cannot be negative");
    }
    if (this._startDate && this._endDate && this._endDate < this._startDate) {
      throw new Error("End date cannot be earlier than start date");
    }
    if (!this._createdBy) {
      throw new Error("PromotionalVideo must have a valid createdBy userId");
    }
  }

  // Method to make the video visible
  makeVisible(): void {
    this._hidden = false;
    this._updatedAt = new Date();
  }

  // Method to update priority
  updatePriority(newPriority: number): void {
    if (newPriority < 0) {
      throw new Error("Priority cannot be negative");
    }
    this._priority = newPriority;
    this._updatedAt = new Date();
  }

  get id(): string | undefined {
    return this._id;
  }

  get category(): PromotionalVideoCategory {
    return this._category;
  }

  get hidden(): boolean {
    return this._hidden;
  }

  get videoId(): string {
    return this._videoId;
  }

  get priority(): number {
    return this._priority;
  }

  get startDate(): Date | null | undefined {
    return this._startDate;
  }

  get endDate(): Date | null | undefined {
    return this._endDate;
  }

  get title(): string | null | undefined {
    return this._title;
  }

  get description(): string | null | undefined {
    return this._description;
  }

  get createdBy(): string {
    return this._createdBy;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}