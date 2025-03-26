import { injectable } from "inversify";
import { Email } from "@/domain/valueObjects/email";

export interface UserProps {
  id?: string;
  email: Email;
  firstName: string;
  lastName?: string | null;
  hashedPassword?: string | null;
  isVerified: boolean;
  isBanned: boolean;
  image?: string | null;
  trial?: boolean;
  extraVideoCount?: number;
  referralId?: string | null;
  totalVideoCount?: number; 
  createdAt?: Date; 
}

@injectable()
export class User {
  private _id?: string;
  private _email: Email;
  private _firstName: string;
  private _lastName?: string | null;
  private _hashedPassword?: string | null;
  private _isVerified: boolean;
  private _isBanned: boolean;
  private _image?: string | null;
  private _trial: boolean;
  private _extraVideoCount: number;
  private _referralId?: string | null;
  private _totalVideoCount: number;
  private _createdAt: Date;

  constructor(props: UserProps) {
    this._id = props.id;
    this._email = props.email;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._hashedPassword = props.hashedPassword;
    this._isVerified = props.isVerified;
    this._isBanned = props.isBanned;
    this._image = props.image;
    this._trial = props.trial ?? false;
    this._extraVideoCount = props.extraVideoCount ?? 0;
    this._referralId = props.referralId;
    this._totalVideoCount = props.totalVideoCount ?? 0;
    this._createdAt = props.createdAt ?? new Date();

    // Enforce business rules
    this.validate();
  }

  static create(props: UserProps): User {
    return new User(props);
  }

  // Business rule: Validate the user
  private validate(): void {
    if (!this._firstName) {
      throw new Error("User must have a first name");
    }
    if (this._extraVideoCount < 0) {
      throw new Error("Extra video count cannot be negative");
    }
    if (this._totalVideoCount < 0) {
      throw new Error("Total video count cannot be negative");
    }
  }

  // Method to ban the user
  ban(): void {
    this._isBanned = true;
  }

  // Method to verify the user
  verify(): void {
    this._isVerified = true;
  }

  // Method to increment total video count
  incrementVideoCount(): void {
    this._totalVideoCount += 1;
  }

  // Getters
  get id(): string | undefined {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string | null | undefined {
    return this._lastName;
  }

  get hashedPassword(): string | null | undefined {
    return this._hashedPassword;
  }

  get isVerified(): boolean {
    return this._isVerified;
  }

  get isBanned(): boolean {
    return this._isBanned;
  }

  get image(): string | null | undefined {
    return this._image;
  }

  get trial(): boolean {
    return this._trial;
  }

  get extraVideoCount(): number {
    return this._extraVideoCount;
  }

  get referralId(): string | null | undefined {
    return this._referralId;
  }

  get totalVideoCount(): number {
    return this._totalVideoCount;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}