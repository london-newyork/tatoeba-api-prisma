import express from 'express';
import passport from 'passport';
import { RequestUser } from '../@types/express';
import { prisma } from '../prisma';
import { DateFormat, dateFormat, formatDate, FormattedDate } from '../date';
import { unlink } from 'fs/promises';
import { upload, bucketName, googleStorage } from '../googleCloudStorage';

const router = express.Router();

router.get('/', async (req: express.Request, res: express.Response) => {
  const tatoe = await prisma.tatoe.findMany({
    take: 100,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          userName: true,
          id: true,
        },
      },
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
  upload.single('image'),
  async (req: express.Request, res: express.Response, next) => {
    const userId = (req.user as RequestUser)?.id;
    const { title, shortParaphrase, description } = req.body;
    const file = req.file;
    console.log('==== POST file', file);
    // console.log('==== POST req.body', req.body);

    // TODO 作成したimageUrlカラムにもURLを格納したい
    const tatoe = await prisma.tatoe.create({
      data: {
        userId,
        title,
        shortParaphrase,
        description,
        // imageUrl
      },
    });

    if (file && bucketName) {
      try {
        const data = await googleStorage
          .bucket(bucketName as string)
          .upload(`${file.path}`, {
            gzip: true,
            destination: `tatoe_images/${tatoe.id}`,
          });
      } finally {
        await unlink(file.path);
        console.log('File has been deleted');
        next();
        res.end();
      }
    } else {
      console.log('There are no file or bucketName');
    }
    res.json({ data: tatoe });
    // const createdAt = tatoe.createdAt;
    // const formattedCreatedAt = formatDate(createdAt, dateFormat);
  }
);

// 自分のtatoe更新
router.put(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  async (req: express.Request, res: express.Response) => {
    const userId = (req.user as RequestUser)?.id;
    const id = req.params.id;
    const { title, shortParaphrase, description, imageUrl } = req.body;
    const file = req.file;
    console.log(`${'\n\n'}=== PUT req.body ===${'\n\n'}`, req.body);

    const recordedTatoeUserId = await prisma.tatoe.findUnique({
      where: { id },
      select: {
        userId: true,
      },
    });

    if (userId !== recordedTatoeUserId?.userId) {
      throw Error('例えを作成したユーザーではありません');
    }

    if (file && bucketName) {
      try {
        const data = await googleStorage
          .bucket(bucketName as string)
          .upload(`${file.path}`, {
            gzip: true,
            destination: `tatoe_images/${id}`,
          });
        // console.log('==== PUT storage data', data);
      } catch {
        throw new Error('エラー');
      } finally {
        await unlink(file.path);
        console.log('File has been deleted');
      }
    } else {
      console.log('There are no file or bucketName');
    }

    try {
      const tatoe = await prisma.tatoe.update({
        where: { id },
        data: {
          userId,
          title,
          shortParaphrase,
          description,
          // imageUrl
        },
      });

      // const createdAt = tatoe.createdAt;
      // const formattedCreatedAt = formatDate(createdAt, dateFormat);
      res.json({ data: tatoe });
    } catch {
      throw Error('更新できませんでした');
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
  // '/:id/explanation_image/:imageId',　//後でこちらを採用
  '/:id/explanation_image',
  async (req: express.Request, res: express.Response, next) => {
    const id = req.params.id; // tId
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
      stream.pipe(res.header({ 'Content-Type': 'image/*' }));
    }
  }
);

// TODO tatoeに登録した説明画像を取り出すためパスを変更する必要がある
router.delete(
  '/:id/explanation_image',
  passport.authenticate('jwt', { session: false }),
  upload.single('image'),
  async (req: express.Request, res: express.Response, next) => {
    const id = req.params.id; // tId

    console.log('======DELETE ID', id);

    // TODO imageUrlカラムから削除して、DBの例えからも削除されるようにする
    if (id) {
      try {
        const tatoe = await prisma.tatoe.delete({
          where: { id },
          select: {
            imageUrl: true,
          },
        });
        res.json({ data: tatoe });
      } catch {
        throw Error('削除できませんでした');
      }
    }

    if (bucketName) {
      const file = googleStorage
        .bucket(bucketName as string)
        .file(`tatoe_images/${id}`);

      const [exists] = await file.exists();

      if (exists) {
        // TODO フロント側の画像を削除したい
        await file.delete().then(() => {});
        console.log('File on GCS has been deleted');
      } else {
        throw Error('データを取得できませんでした。');
      }
    } else {
      res.statusCode = 500;
      res.end('500 error');
    }
  }
);

export default router;
