import express from 'express';

import jwt from 'jsonwebtoken';
import passport from '../lib/security';

const router = express.Router();

router.post(
  '/login',
  passport.authenticate('local', {
    session: false,
    successReturnToOrRedirect: '/',
    failureRedirect: '/login',
    failureMessage: true,
  }),
  (req, res, next) => {
    // 1 jwtのtokenを作成 passwordはどうなるのか=>payloadには含められないはず
    const email = req.body.email;
    const payload = { email: req.body.email };
    const token = jwt.sign(
      payload,
      process.env.STRATEGYJWT_SECRET_KEY as string,
      {
        expiresIn: '1m',
      }
    );
    res.json({ email, token });
  }
);
