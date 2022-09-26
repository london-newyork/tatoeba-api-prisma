import express from 'express';
import passport from 'passport';
import { RequestUser } from '../@types/express';
import { prisma } from '../prisma';
import { DateFormat, dateFormat, formatDate, FormattedDate } from '../date';

import { createReadStream } from 'fs';
import { unlink } from 'fs/promises';
import path from 'path';
import { upload, bucketName, googleStorage } from '../googleCloudStorage';
const router = express.Router();

router.get('/', async (req: express.Request, res: express.Response) => {
  const tatoe = await prisma.tatoe.findMany({
    take: 100,
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({ tatoe });
});

router.get('/:tId', async (req: express.Request, res: express.Response) => {
  const tId = req.params.tId;

  const tatoe = await prisma.tatoe.findUnique({
    where: { id: tId },
  });
  console.log(tatoe);

  res.json({ data: tatoe });
});

router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    const userId = (req.user as RequestUser)?.id;
    const { tId, title, shortParaphrase, description } = req.body;

    const tatoe = await prisma.tatoe.create({
      data: {
        userId,
        id: tId,
        title,
        shortParaphrase,
        description,
      },
    });
    // const createdAt = tatoe.createdAt;
    // const formattedCreatedAt = formatDate(createdAt, dateFormat);
    res.json({ data: tatoe });
  }
);

// 自分のtatoe更新
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    const userId = (req.user as RequestUser)?.id;
    const id = req.params.id;
    const { tId, title, shortParaphrase, description } = req.body;

    if (tId === id) {
      try {
        const tatoe = await prisma.tatoe.update({
          where: { id },
          data: {
            userId,
            id,
            title,
            shortParaphrase,
            description,
          },
        });

        // const createdAt = tatoe.createdAt;
        // const formattedCreatedAt = formatDate(createdAt, dateFormat);
        res.json({ data: tatoe });
      } catch {
        throw Error('更新できませんでした');
      }
    }
  }
);

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    const id = req.params.id;
    const { tId } = req.body;
    if (tId === id) {
      try {
        const tatoe = await prisma.tatoe.delete({
          where: { id },
        });
        res.json({ data: tatoe });
      } catch {
        throw Error('削除できませんでした');
      }
    }
  }
);

// 説明画像
router.get(
  '/:id/explanation_image',
  async (req: express.Request, res: express.Response, next) => {
    const id = req.params.id; // tId
    const userId = (req.user as RequestUser)?.id;
    console.log('====GET tId???', id);
    console.log('====GET USER ID???', userId); // false
    const file = googleStorage
      .bucket(bucketName as string)
      .file(`tatoe_images/${id}`);

    const [exists] = await file.exists();

    console.log('====GET EXISTS??', exists); // false
    if (exists) {
      const stream = file.createReadStream();
      stream.on('error', (error) => {
        console.log(`${error}`);
        res.statusCode = 500;
        res.end('500 error');
      });
      stream.pipe(res);
    }
    // デフォルト画像はフロント側CSSで用意されているのでいらない
  }
);

router.put(
  '/:id/explanation_image',
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  async (req: express.Request, res: express.Response, next) => {
    const id = req.params.id; // tId
    const userId = (req.user as RequestUser)?.id;
    const file = req.file;
    console.log('======PUT tId', id);
    console.log('======PUT USER ID', userId);
    console.log('===EXPLANATION IMAGE', file);

    // バケットのパスにuserIdいれたほうがいいか検討中
    // uploadsというディレクトリにフロントから画像が来るが、userIdも同じディレクトリになっているので、大丈夫か
    if (file && bucketName) {
      try {
        const data = await googleStorage
          .bucket(bucketName as string)
          .upload(`${file.path}`, {
            gzip: true,
            destination: `tatoe_images/${id}`,
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
);

router.delete(
  '/:id/explanation_image',
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  async (req: express.Request, res: express.Response, next) => {
    const id = req.params.id; // tId
    const userId = (req.user as RequestUser)?.id;
    const file = req.file;
    console.log('======ID', id);
    console.log('======USER ID', userId);
    console.log('===EXPLANATION IMAGE', file);

    // TODO ここに削除処理をかく
    if (file && bucketName) {
      const file = googleStorage
        .bucket(bucketName as string)
        .file(`tatoe_images/${id}`);

      const [exists] = await file.exists();

      if (exists) {
        const stream = file.createReadStream();
        stream.on('error', (error) => {
          console.log(`${error}`);
          res.statusCode = 500;
          res.end('500 error');
        });
        stream.pipe(res);
      }
    }
  }
);

export default router;
