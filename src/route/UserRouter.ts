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
router.param('id', function (req, res, next, id) {
  next();
});

router.post(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    const id = req.params.id;
    const userId = (req.user as RequestUser)?.id;
    const userName = req.body.userName;
    console.log('userのusedId,userName：', id, userName);

    if (userId === id) {
      try {
        await prisma.user.update({
          where: { id },
          data: { userName },
        });

        res.send({ message: 'ユーザー名を変更しました' });
      } catch (err) {
        throw err;
      }
    }
  }
);
export default router;
