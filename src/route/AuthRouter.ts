import { User } from '@prisma/client';
import express from 'express';

import jwt from 'jsonwebtoken';
import passport from 'passport';
import { prisma } from '../prisma';

const router = express.Router();

const bcrypt = require('bcrypt');

router.get('/login', async (req, res, next) => {
  const email = req.body.email;
  console.log('email', email);

  const password = req.body.password;
  const user = await prisma.user.findUnique({ where: { email, id: '' } });
});

router.post(
  '/login',
  passport.authenticate('local', {
    session: false,
  }),
  async (req, res, next) => {
    // 1 jwtのtokenを作成 passwordはペイロードに含めない
    const email = req.body.email;
    const password = req.body.password;
    const user = req.user as User;
    // const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error('ログイン情報が正しくありません。');
    }
    const isOK = await bcrypt.compare(password, user?.password);
    if (!isOK) {
      throw new Error('ログイン情報が正しくありません。');
    }
    // const payload = { email: user.email, id: user.id };

    const payload = { email: user.email };
    const token = jwt.sign(
      payload,
      process.env.STRATEGYJWT_SECRET_KEY as string,
      {
        expiresIn: '12h',
      }
    );
    res.json({ token });
    //12h以降のrefreshTokenを用意する。
    //フロント側でtokenを保存
  }
);

export default router;
