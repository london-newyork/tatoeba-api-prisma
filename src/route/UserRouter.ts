import express from 'express';

import passport from 'passport';
import { prisma } from '../prisma';

import { RequestUser } from '../@types/express';
import UserTatoeRouter from '../route/UserTatoeRouter';
import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import path from 'path';
import { upload, bucketName, googleStorage } from '../googleCloudStorage';

const router = express.Router();

// (/users)/:userId/tatoe/:tatoeId
router.use('/', UserTatoeRouter);

//一覧取得
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    // 本当は他のユーザーの情報はみられないようにする
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
        const updatedData = await prisma.user.update({
          where: { id },
          data: { userName },
        });
        res.json({ updatedData });
      } catch (err) {
        throw err;
      }
    }
  }
);

// アバター読み込み
router.get(
  '/:id/profile_image',
  async (req: express.Request, res: express.Response, next) => {
    const id = req.params.id;

    const file = googleStorage
      .bucket(bucketName as string)
      .file(`user_images/${id}`);

    const [exists] = await file.exists();

    if (exists) {
      const stream = file.createReadStream();
      stream.on('error', (error) => {
        console.log(`${error}`);
        res.statusCode = 500;
        res.end('500 error');
      });
      stream.pipe(res);
    } else {
      const filePath = path.join(process.cwd(), 'assets/default_avatar.png');

      const stream = createReadStream(filePath);
      stream.on('error', (error) => {
        console.log(`${error}`);
        res.statusCode = 500;
        res.end('500 error');
      });

      stream.pipe(res);
    }
  }
);

// アバター登録
router.put(
  '/:id/profile_image',
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  async (req: express.Request, res: express.Response, next) => {
    const id = req.params.id;
    const userId = (req.user as RequestUser)?.id;
    const file = req.file;

    if (userId === id) {
      if (file && bucketName) {
        try {
          const data = await googleStorage
            .bucket(bucketName as string)
            .upload(`${file.path}`, {
              gzip: true,
              destination: `user_images/${userId}`,
            });

          res.json({ data });
          console.log('data', data);
        } finally {
          await unlink(file.path);
          console.log('File has been deleted');
        }
      } else {
        console.log('There are no file and bucketName');
        next();
      }
    }
  }
);

export default router;
