import express from 'express';
import multer from 'multer';

import passport from 'passport';
import { prisma } from '../prisma';

import { RequestUser } from '../@types/express';
import UserTatoeRouter from '../route/UserTatoeRouter';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// (/users)/:userId/tatoe/:tatoeId
router.use('/:userId/tatoe', UserTatoeRouter);

//一覧取得
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    // 本当は他のユーザーの情報はみられないようにする
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

router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    const id = req.params.id;
    const userId = (req.user as RequestUser)?.id;
    const userName = req.body.userName;

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

// TODO GET: /users /:id/profile_image

// profile_image file登録
router.put(
  '/:id/profile_image',
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  // fetch(---, {body: {image: File }})
  async (req: express.Request, res: express.Response) => {
    const id = req.params.id;
    const userId = (req.user as RequestUser)?.id;
    const file = req.file;
  }
);

export default router;
