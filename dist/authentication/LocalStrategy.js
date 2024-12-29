"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const userRepository_1 = require("../repositories/userRepository");
passport_1.default.use(new passport_local_1.Strategy({
    usernameField: "email",
    session: false,
}, async (email, password, done) => {
    try {
        console.log(email, password);
        const user = await (0, userRepository_1.getUserByEmail)(email);
        if (!user) {
            return done(null, false, { message: "Incorrect credential" });
        }
        if (user.hashedPassword === null) {
            return done(null, false, { message: "Please login with Google" });
        }
        if (!bcryptjs_1.default.compareSync(password, user.hashedPassword)) {
            return done(null, false, { message: "Incorrect credential" });
        }
        const returnedUser = {
            id: user.id,
            email: user.email,
            method: "credential",
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
        };
        return done(null, returnedUser);
    }
    catch (err) {
        console.error("Error in LocalStrategy:", err);
        return done(err);
    }
}));
