import passport from 'passport';
import {
  Strategy as JwtStrategy,
  ExtractJwt,
  StrategyOptionsWithoutRequest,
} from 'passport-jwt';
import env from '../env';
import { getUserById } from '../repositories/userRepository';

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: env.ACCESS_TOKEN_SECRET,
} satisfies StrategyOptionsWithoutRequest;

passport.use(
  new JwtStrategy(opts, async (jwt_payload, done) => {
    try {
      console.log('============jwt_payload==============')
      console.log(jwt_payload)
      console.log('=====================================')

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
