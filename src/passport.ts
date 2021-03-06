import passport from 'passport';
import { prisma } from '../src/prisma';
import { Strategy as StrategyLocal } from 'passport-local';
import { ExtractJwt, Strategy as StrategyJWT } from 'passport-jwt';

import bcrypt from 'bcrypt';

passport.use(
  new StrategyLocal(
    { usernameField: 'email', session: false },
    async (email: string, password: string, done) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return done(new Error('ログイン情報が正しくありません。'), null);
      }
      const isOK = await bcrypt.compare(password, user?.password);

      if (isOK) {
        return done(null, user); //ログイン成功時はfalseの部分がユーザー情報に書き換わる。失敗時はfalse
      } else {
        return done(new Error('ログイン情報が正しくありません。'), null);
      }
    }
  )
);

passport.use(
  new StrategyJWT(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.STRATEGYJWT_SECRET_KEY,
    },
    (payload, done) => {
      done(null, payload);
    }
  )
);

export { passport };
