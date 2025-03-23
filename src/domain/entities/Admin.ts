// backend/src/domain/entities/admin.ts
import { injectable } from "inversify";
import { Email } from "@/domain/valueObjects/email";

export interface AdminProps {
  id?: string;
  email: Email;
  firstName: string;
  lastName?: string | null;
  hashedPassword?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date | null;
  isActive: boolean;
  image?: string | null;
}

@injectable()
export class Admin {
  private _id?: string;
  private _email: Email;
  private _firstName: string;
  private _lastName?: string | null;
  private _hashedPassword?: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _lastLogin?: Date | null;
  private _isActive: boolean;
  private _image?: string | null;

  constructor(props: AdminProps) {
    this._id = props.id;
    this._email = props.email;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._hashedPassword = props.hashedPassword;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
    this._lastLogin = props.lastLogin;
    this._isActive = props.isActive;
    this._image = props.image;

    // Enforce business rules
    this.validate();
  }

  static create(props: AdminProps): Admin {
    return new Admin(props);
  }

  // Business rule: Validate the admin
  private validate(): void {
    if (!this._firstName) {
      throw new Error("Admin must have a first name");
    }
  }

  // Method to deactivate the admin
  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  // Method to update last login
  updateLastLogin(): void {
    this._lastLogin = new Date();
    this._updatedAt = new Date();
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

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get lastLogin(): Date | null | undefined {
    return this._lastLogin;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get image(): string | null | undefined {
    return this._image;
  }
}