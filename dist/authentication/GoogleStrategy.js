"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const env_1 = __importDefault(require("../env"));
const userRepository_1 = require("../repositories/userRepository");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: env_1.default.GOOGLE_CLIENT_ID,
    clientSecret: env_1.default.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/user/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
    if (!profile.emails)
        return done("Profile not found");
    try {
        let user = await (0, userRepository_1.getUserByEmail)(profile.emails[0].value);
        if (!user) {
            const newUser = {
                email: profile.emails?.[0].value || "",
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                image: profile.photos?.[0].value,
                hashedPassword: "",
            };
            user = await (0, userRepository_1.createUser)(newUser);
        }
        return done(null, user);
    }
    catch (err) {
        return done(err);
    }
}));
