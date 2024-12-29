"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class TokenService {
    static generateToken(data, secret) {
        return jsonwebtoken_1.default.sign(data, secret, {
            expiresIn: "30d",
        });
    }
    static verifyToken = (token, secret) => {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            return {
                valid: true,
                id: decoded.id,
                message: "Token is valid",
            };
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                return {
                    valid: false,
                    message: "Token has expired",
                };
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                return {
                    valid: false,
                    message: "Token is invalid",
                };
            }
            return {
                valid: false,
                message: "Token verification failed",
            };
        }
    };
}
exports.TokenService = TokenService;
exports.default = TokenService;
