import { injectable } from "inversify";

@injectable()
export class Email {
  private _address: string;

  constructor(address: string) {
    if (!address.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
      throw new Error("Invalid email");
    }
    this._address = address;
  }

  get address(): string {
    return this._address;
  }
}