import express from 'express';
import multer from 'multer';

import passport from 'passport';
import { prisma } from '../prisma';
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';

import { RequestUser } from '../@types/express';
import UserTatoeRouter from '../route/UserTatoeRouter';
import fs from 'fs/promises';

const router = express.Router();

// (/users)/:userId/tatoe/:tatoeId
router.use('/:userId/tatoe', UserTatoeRouter);

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

// TODO GET: /users /:id/profile_image

// Multerを使ってファイル名を書き換える
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

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

    const thisProjectId = process.env.GCS_PROJECT_ID;
    const keyFilename = process.env.GCS_SERVICE_KEY_PATH;

    // 任意の名前で作成したバケット名
    const bucketName = process.env.GCS_BUCKET_NAME;

    // バケットの取得
    const googleStorage = new Storage({
      projectId: thisProjectId,
      keyFilename: keyFilename,
    });

    if (userId === id) {
      if (file && bucketName) {
        const main = async () => {
          try {
            await googleStorage
              .bucket(bucketName)
              .upload(`${file.path}`, { gzip: true })
              .then((res) => {
                // 公開状態にする場合
                // res[0].makePublic();
                console.log(res[0].metadata);
                console.log('Success');
              })
              .catch((err) => {
                console.error('ERROR:', err);
              });
          } finally {
            await fs.unlink(file.path);
            console.log('File has been deleted');
          }
        };
        main();
      } else throw 'There are no file and bucketName';
    } else throw 'Different user';
  }
);

export default router;
