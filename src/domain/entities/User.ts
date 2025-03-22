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
}

export class User {
	private _id?: string;
	private _email: Email;
	private _firstName: string;
	private _lastName?: string | null;
	private _hashedPassword?: string | null;
	private _isVerified: boolean;
	private _isBanned: boolean;
	private _image?: string | null;

	constructor(props: UserProps) {
		this._id = props.id;
		this._email = props.email;
		this._firstName = props.firstName;
		this._lastName = props.lastName;
		this._hashedPassword = props.hashedPassword;
		this._isVerified = props.isVerified;
		this._isBanned = props.isBanned;
		this._image = props.image;
	}

	static create(props: UserProps): User {
		return new User(props);
	}

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
}
