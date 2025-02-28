import { Request } from "express";
import { RequestUser } from ".";

declare module "express" {
	interface Request extends Request {
		user: RequestUser
	}
}
