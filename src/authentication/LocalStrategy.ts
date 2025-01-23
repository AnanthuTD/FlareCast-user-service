import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "../repositories/userRepository";
import { logger } from "../logger/logger";

passport.use(
	new LocalStrategy(
		{
			usernameField: "email",
			session: false,
		},
		async (email, password, done) => {
			try {
				logger.info(email, password)
				const user = await getUserByEmail(email);

				if (!user) {
					return done(null, false, { message: "Incorrect credential" });
				}

				if (user.hashedPassword === null) {
					return done(null, false, { message: "Please login with Google" });
				}

				if (!bcrypt.compareSync(password, user.hashedPassword)) {
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
			} catch (err) {
				logger.error("Error in LocalStrategy:", err);
				return done(err);
			}
		}
	)
);
