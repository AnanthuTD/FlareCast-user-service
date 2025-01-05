import express from "express";
import {
	createUser,
	getUserByEmail,
	getUserById,
	userExists,
} from "../repositories/userRepository";
import { hashPassword } from "../helpers/hashPassword";
import TokenService from "../helpers/TokenService";
import env from "../env";
import { User } from "@prisma/client";
import passport from "passport";
import axios from "axios";
import { authResponseUserObject } from "../dto/user.dto";

const router = express.Router();

router.get("/user-exist", async (req, res) => {
	console.log(req.query);
	const { email } = req.query;
	console.log(email);
	if (!email) {
		return res.status(400).json({ message: "Email is required" });
	}
	const data = await userExists(email as string);
	return res.json(data);
});

router.post(
	"/sign-in",
	passport.authenticate("local", { session: false }),
	async (req, res) => {
		const { user } = req;

		if (!user) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const accessToken = TokenService.generateToken(
			user,
			env.ACCESS_TOKEN_SECRET as string
		);
		const refreshToken = TokenService.generateToken(
			user,
			env.REFRESH_TOKEN_SECRET as string
		);

		res.cookie("refreshToken", refreshToken);
		res.json({ accessToken, user, refreshToken });
	}
);

router.post("/sign-up", async (req, res) => {
	const { email, password, firstName, lastName, image } = req.body;
	if (!email || !password || !firstName || !lastName) {
		return res.status(400).json({
			message: "Email, password, first name, and last name are required",
		});
	}

	const data = await userExists(email as string);
	if (data) {
		return res.status(400).json({ message: "User already exists" });
	}

	const hashedPassword = await hashPassword(password as string);
	const user = await createUser({
		email: email as string,
		hashedPassword: hashedPassword as string,
		firstName: firstName as string,
		lastName: lastName as string,
		image: image as string,
	});

	const accessToken = TokenService.generateToken(
		{ id: user.id },
		env.ACCESS_TOKEN_SECRET as string
	);
	const refreshToken = TokenService.generateToken(
		{ id: user.id },
		env.REFRESH_TOKEN_SECRET as string
	);

	res.cookie("refreshToken", refreshToken);

	return res.json({ message: "User created", accessToken , refreshToken});
});

router.post("/google-sign-in", async (req, res) => {
	const { code } = req.body;

	console.log(code);

	if (!code) {
		return res.status(400).json({ error: "Authorization code is required." });
	}

	try {
		const data = await axios.get(
			`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${code.access_token}`,
			{
				headers: {
					Authorization: `Bearer ${code.access_token}`,
					Accept: "application/json",
				},
			}
		);

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

		let user = (await getUserByEmail(
			extractedUser.email as string
		)) as Partial<User>;

		if (!user) {
			user = await createUser({
				email: extractedUser.email as string,
				firstName: extractedUser.firstName as string,
				lastName: extractedUser.lastName as string,
				image: extractedUser.image as string,
			});
		}

		const accessToken = TokenService.generateToken(
			{ id: user.id },
			env.ACCESS_TOKEN_SECRET as string
		);
		const refreshToken = TokenService.generateToken(
			{ id: user.id },
			env.REFRESH_TOKEN_SECRET as string
		);

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
			refreshToken
		});
	} catch (error) {
		console.error(
			"Error during Google sign-in:",
			error.response?.data || error.message
		);
		res.status(500).json({ error: "Failed to process the Google sign-in." });
	}
});

router.get(
	"/check-authentication",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		const { user } = req;
		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		return res.json({ user });
	}
);

router.get("/refresh-token", async (req, res) => {
	console.log(
		"=================================Refreshing token================================="
	);
	const refreshToken = req.cookies.refreshToken;
	if (!refreshToken) {
		console.log("No refresh token");
		return res.status(401).json({ message: "Unauthorized" });
	}

	try {
		const payload = TokenService.verifyToken(
			refreshToken,
			env.REFRESH_TOKEN_SECRET as string
		);
		if (!payload.valid || !payload.id) {
			console.log("Invalid refresh token", payload);
			return res.status(401).json({ message: payload.message });
		}

		const user = await getUserById(payload.id);
		if (!user) {
			console.log("User not found");
			return res
				.status(401)
				.json({ message: payload.message || "Unauthorized" });
		}

		// TODO: Only storing the user id in the token for now
		const accessToken = TokenService.generateToken(
			{ id: user.id },
			env.ACCESS_TOKEN_SECRET as string
		);
		const newRefreshToken = TokenService.generateToken(
			{ id: user.id },
			env.REFRESH_TOKEN_SECRET as string
		);

		res.cookie("refreshToken", newRefreshToken);
		return res.json({ accessToken });
	} catch (error) {
		console.error("Error during token refresh:", error);
		return res.status(401).json({ message: "Unauthorized" });
	} finally {
		console.log(
			"=================================End of Refreshing token================================="
		);
	}
});

router.post("/post-login", async (req, res) => {
	console.log(
		"=================================Refreshing token by electron================================="
	);
	const refreshToken = req.body.refreshToken;
	if (!refreshToken) {
		console.log("No refresh token");
		return res.status(401).json({ message: "Unauthorized" });
	}

	// console.log("refreshToken: " + refreshToken);

	try {
		const payload = TokenService.verifyToken(
			refreshToken,
			env.REFRESH_TOKEN_SECRET as string
		);
		if (!payload.valid || !payload.id) {
			console.log("Invalid refresh token", payload);
			return res.status(401).json({ message: payload.message });
		}

		const user = await getUserById(payload.id);
		if (!user) {
			console.log("User not found");
			return res
				.status(401)
				.json({ message: payload.message || "Unauthorized" });
		}

		// TODO: Only storing the user id in the token for now
		const accessToken = TokenService.generateToken(
			{ id: user.id },
			env.ACCESS_TOKEN_SECRET as string
		);
		const newRefreshToken = TokenService.generateToken(
			{ id: user.id },
			env.REFRESH_TOKEN_SECRET as string
		);

		

		res.cookie("refreshToken", newRefreshToken);
		return res.json({ user: {accessToken, ...authResponseUserObject(user)} });
	} catch (error) {
		console.error("Error during token refresh:", error);
		return res.status(401).json({ message: "Unauthorized" });
	} finally {
		console.log(
			"=================================End of Refreshing token================================="
		);
	}
});

export default router;
