import jwt from "jsonwebtoken";
import { User } from "@prisma/client";

export class TokenService {
	public static generateToken(data: Partial<User>, secret: string): string {
		return jwt.sign(data, secret, {
			expiresIn: "30d",
		});
	}

	public static verifyToken =  (
		token: string,
		secret: string
	): { valid: boolean; id?: string; message: string ; decoded?: jwt.JwtPayload} => {
		try {
			const decoded = jwt.verify(token, secret) as jwt.JwtPayload;

			return {
				valid: true,
				id: decoded.id,
				message: "Token is valid",
				decoded
			};
		} catch (error) {
			// logger.error(error);

			if (error instanceof jwt.TokenExpiredError) {
				return {
					valid: false,
					message: "Token has expired",
				};
			}

			if (error instanceof jwt.JsonWebTokenError) {
				return {
					valid: false,
					message: error.JsonWebTokenError || "Token is invalid",
				};
			}

			return {
				valid: false,
				message: "Token verification failed",
			};
		}
	};

	/* public static isExpiredAccessToken(token): boolean {
		const decoded = jwt.decode(token, { complete: true });
    if (decoded && decoded.exp) {
      const expirationDate = new Date(0);
      expirationDate.setUTCSeconds(decoded.exp);
      return new Date() > expirationDate;
    }
    return false;
	} */
}

export default TokenService;
