import { User } from '@prisma/client';
import express from 'express';

import jwt from 'jsonwebtoken';
import passport from 'passport';

const router = express.Router();

router.post(
  '/login',
  passport.authenticate('local', {
    session: false,
  }),
  async (req, res, next) => {
    // 1 jwtのtokenを作成 passwordはペイロードに含めない
    const user = req.user as User;
    const payload = { email: user.email, id: user.id };
    const token = jwt.sign(
      payload,
      process.env.STRATEGYJWT_SECRET_KEY as string,
      {
        expiresIn: '12h',
      }
    );
    res.json({ token });
    //12h以降のrefreshTokenを用意する。
  }
);

export default router;
