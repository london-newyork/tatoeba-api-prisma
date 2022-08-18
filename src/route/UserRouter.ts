import { User } from '@prisma/client';
import express from 'express';

import passport from 'passport';
import { prisma } from '../prisma';

import { validate } from 'email-validator';
import { RequestUser } from '../@types/express';

const router = express.Router();

//一覧取得
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    // 本当は他のユーザーの情報はみれないようにする
    console.log('user: ', req.user);
    const users = await prisma.user.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ users });
  }
);

router.get(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    const id = req.params.id;
    const userId = (req.user as RequestUser)?.id;
    if (userId === id) {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          userName: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      res.json({ data: user });
    } else {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          userName: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      res.json({ data: user });
    }
  }
);

// userNameを登録する
router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    const email = req.body.email;
    const userName = req.body.userName;
    console.log('userのemail,userName：', email, userName);

    if (!validate(email)) {
      // メールアドレスの形式が正しくない時
      throw new Error('データが不正です。');
    }
    try {
      await prisma.user.update({
        where: { email },
        data: { userName },
      });

      res.send({ message: 'ユーザー名を変更しました' });
      // await res.redirect(
      //   `${process.env.FRONTEND_URL}/?users=${}`
      // );
    } catch (err) {
      throw err;
    }
  }
);
export default router;
