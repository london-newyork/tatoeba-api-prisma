import express from 'express';

import passport from 'passport';
import { prisma } from '../prisma';

import { RequestUser } from '../@types/express';
import UserTatoeRouter from '../route/UserTatoeRouter';
import fs from 'fs/promises';
import { readFileSync, promises as fsPromises } from 'fs';
import { upload, bucketName, googleStorage } from '../googleCloudStorage';

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
router.get(
  '/:id/profile_image',
  passport.authenticate('jwt', { session: false }),
  // upload.single('image'),
  // fetch(---, {body: {image: File }})
  async (req: express.Request, res: express.Response, next) => {
    const id = req.params.id;
    const userId = (req.user as RequestUser)?.id;
    const file = req.file;

    if (userId === id) {
      if (file && bucketName) {
        const main = async () => {
          // GCSからの読み込み
          await googleStorage
            .bucket(bucketName as string)
            .getFiles({ prefix: '/' })
            // .getFiles({ prefix: `/${userId}` }) // putで作成したディレクトリ名とuserId指定
            .then((res) => {
              console.log('Success');
            })
            .catch((err) => {
              console.error('ERROR:', err);
            });
        };
        main();
        // フロントへ画像を送る
        await fs.readFile('illust350.png').then((data) => {
          res.type('png');
          res.send(data);
        });
      } else throw 'There are no file and bucketName';
    } else throw 'Different user';
    res.json();
    next();
  }
);

// profile_image file登録
router.put(
  '/:id/profile_image',
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  // fetch(---, {body: {image: File }})
  async (req: express.Request, res: express.Response, next) => {
    const id = req.params.id;
    const userId = (req.user as RequestUser)?.id;
    const file = req.file;

    // TODO userごとにディレクトリを作る必要がある
    // (bucketName)/user_images/userId/..png

    if (userId === id) {
      if (file && bucketName) {
        const main = async () => {
          try {
            const data = await googleStorage
              .bucket(bucketName as string)
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
            // TODO データとしてフロントに返してフロントで画像更新したい

            res.json({ data });
            console.log('data', data);
          } finally {
            await fs.unlink(file.path);
            console.log('File has been deleted');
          }
        };
        main();
      } else {
        console.log('There are no file and bucketName');
        next();
      }
    }
    console.log('Different User');
  }
);

export default router;
