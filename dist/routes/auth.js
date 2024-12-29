"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userRepository_1 = require("../repositories/userRepository");
const hashPassword_1 = require("../helpers/hashPassword");
const TokenService_1 = __importDefault(require("../helpers/TokenService"));
const env_1 = __importDefault(require("../env"));
const passport_1 = __importDefault(require("passport"));
const axios_1 = __importDefault(require("axios"));
const router = express_1.default.Router();
router.get("/user-exist", async (req, res) => {
    console.log(req.query);
    const { email } = req.query;
    console.log(email);
    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }
    const data = await (0, userRepository_1.userExists)(email);
    return res.json(data);
});
router.post("/sign-in", passport_1.default.authenticate("local", { session: false }), async (req, res) => {
    const { user } = req;
    if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
    }
    const accessToken = TokenService_1.default.generateToken(user, env_1.default.ACCESS_TOKEN_SECRET);
    const refreshToken = TokenService_1.default.generateToken(user, env_1.default.REFRESH_TOKEN_SECRET);
    res.cookie("refreshToken", refreshToken);
    res.json({ accessToken, user });
});
router.post("/sign-up", async (req, res) => {
    const { email, password, firstName, lastName, image } = req.body;
    if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
            message: "Email, password, first name, and last name are required",
        });
    }
    const data = await (0, userRepository_1.userExists)(email);
    if (data) {
        return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await (0, hashPassword_1.hashPassword)(password);
    const user = await (0, userRepository_1.createUser)({
        email: email,
        hashedPassword: hashedPassword,
        firstName: firstName,
        lastName: lastName,
        image: image,
    });
    const accessToken = TokenService_1.default.generateToken({ id: user.id }, env_1.default.ACCESS_TOKEN_SECRET);
    const refreshToken = TokenService_1.default.generateToken({ id: user.id }, env_1.default.REFRESH_TOKEN_SECRET);
    res.cookie("refreshToken", refreshToken);
    return res.json({ message: "User created", accessToken });
});
router.post("/google-sign-in", async (req, res) => {
    const { code } = req.body;
    console.log(code);
    if (!code) {
        return res.status(400).json({ error: "Authorization code is required." });
    }
    try {
        const data = await axios_1.default.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${code.access_token}`, {
            headers: {
                Authorization: `Bearer ${code.access_token}`,
                Accept: "application/json",
            },
        });
        if (!data || !data?.data) {
            return res
                .status(400)
                .json({ message: "Failed to authenticate with Google." });
        }
        const payload = data.data;
        const extractedUser = {
            email: payload.email,
            firstName: payload.given_name,
            lastName: payload.family_name,
            image: payload.picture,
        };
        let user = (await (0, userRepository_1.getUserByEmail)(extractedUser.email));
        if (!user) {
            user = await (0, userRepository_1.createUser)({
                email: extractedUser.email,
                firstName: extractedUser.firstName,
                lastName: extractedUser.lastName,
                image: extractedUser.image,
            });
        }
        const accessToken = TokenService_1.default.generateToken({ id: user.id }, env_1.default.ACCESS_TOKEN_SECRET);
        const refreshToken = TokenService_1.default.generateToken({ id: user.id }, env_1.default.REFRESH_TOKEN_SECRET);
        res.cookie("refreshToken", refreshToken);
        res.status(200).json({
            message: "Successfully authenticated.",
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                accessToken,
                image: user.image,
            },
        });
    }
    catch (error) {
        console.error("Error during Google sign-in:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to process the Google sign-in." });
    }
});
router.get("/check-authentication", passport_1.default.authenticate("jwt", { session: false }), async (req, res) => {
    const { user } = req;
    if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    return res.json({ user });
});
router.get("/refresh-token", async (req, res) => {
    console.log("=================================Refreshing token=================================");
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        console.log("No refresh token");
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const payload = TokenService_1.default.verifyToken(refreshToken, env_1.default.REFRESH_TOKEN_SECRET);
        if (!payload.valid || !payload.id) {
            console.log("Invalid refresh token", payload);
            return res.status(401).json({ message: payload.message });
        }
        const user = await (0, userRepository_1.getUserById)(payload.id);
        if (!user) {
            console.log("User not found");
            return res
                .status(401)
                .json({ message: payload.message || "Unauthorized" });
        }
        // TODO: Only storing the user id in the token for now
        const accessToken = TokenService_1.default.generateToken({ id: user.id }, env_1.default.ACCESS_TOKEN_SECRET);
        const newRefreshToken = TokenService_1.default.generateToken({ id: user.id }, env_1.default.REFRESH_TOKEN_SECRET);
        res.cookie("refreshToken", newRefreshToken);
        return res.json({ accessToken });
    }
    catch (error) {
        console.error("Error during token refresh:", error);
        return res.status(401).json({ message: "Unauthorized" });
    }
    finally {
        console.log("=================================End of Refreshing token=================================");
    }
});
exports.default = router;
