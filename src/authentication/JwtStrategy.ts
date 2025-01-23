import passport from "passport";
import {
	Strategy as JwtStrategy,
	ExtractJwt,
	StrategyOptionsWithoutRequest,
} from "passport-jwt";
import env from "../env";
import { getUserById } from "../repositories/userRepository";
import { logger } from "../logger/logger";

const opts = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: env.ACCESS_TOKEN_SECRET,
} satisfies StrategyOptionsWithoutRequest;

passport.use(
	new JwtStrategy(opts, async (jwt_payload, done) => {
		try {
			logger.info("============jwt_payload==============");
			logger.info(jwt_payload);
			logger.info("=====================================");

			const user = await getUserById(jwt_payload.id);
			if (user) {
				return done(null, user);
			} else {
				return done(null, false);
			}
		} catch (err) {
			return done(err, false);
		}
	})
);
