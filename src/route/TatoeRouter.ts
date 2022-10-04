import express from 'express';
import passport from 'passport';
import { RequestUser } from '../@types/express';
import { prisma } from '../prisma';
import { DateFormat, dateFormat, formatDate, FormattedDate } from '../date';
import { unlink } from 'fs/promises';
import { upload, bucketName, googleStorage } from '../googleCloudStorage';
import { nanoid } from 'nanoid';

const router = express.Router();

// 全員の分
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

// Search Result
router.get('/:tId', async (req: express.Request, res: express.Response) => {
  const tId = req.params.tId;

  const tatoe = await prisma.tatoe.findUnique({
    where: { id: tId },
  });
  const newTatoe = {
    ...tatoe,
    imageUrl: tatoe?.imageId
      ? `${process.env.BACKEND_URL}tatoe/${tatoe?.id}/explanation_image/${tatoe.imageId}`
      : null,
  };
  res.json({ data: newTatoe });
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

    const imageId = file ? nanoid() : null;
    const tatoe = await prisma.tatoe.create({
      data: {
        userId,
        title,
        shortParaphrase,
        description,
        imageId,
      },
    });

    if (file && bucketName) {
      try {
        await googleStorage
          .bucket(bucketName as string)
          .upload(`${file.path}`, {
            gzip: true,
            destination: `tatoe_images/${tatoe.id}/${tatoe.imageId}`,
          });
      } finally {
        await unlink(file.path);
        console.log('File on dir uploads has been deleted');
      }
    } else {
      console.log('There are no file or bucketName');
    }

    const newTatoe = {
      ...tatoe,
      imageUrl: imageId
        ? `${process.env.BACKEND_URL}tatoe/${tatoe.id}/explanation_image/${imageId}`
        : null,
    };
    res.json({ data: newTatoe });

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
    const { title, shortParaphrase, description } = req.body;
    const file = req.file;
    console.log(`${'\n\n'}=== PUT :id(tId) ===${'\n\n'}`, id);
    console.log(`${'\n\n'}=== PUT userId ===${'\n\n'}`, userId);

    const prevTatoe = await prisma.tatoe.findUnique({
      where: { id },
      select: {
        userId: true,
        imageId: true,
      },
    });

    if (userId !== prevTatoe?.userId) {
      throw Error('例えを作成したユーザーではありません');
    }
    if (!file) {
      console.log('画像データがないため画像は更新されません。');
    }

    let newImageId = prevTatoe.imageId;
    if (file) {
      try {
        newImageId = nanoid();
        await googleStorage
          .bucket(bucketName as string)
          .upload(`${file.path}`, {
            gzip: true,
            destination: `tatoe_images/${id}/${newImageId}`,
          });
      } catch {
        throw new Error('エラー');
      } finally {
        await unlink(file.path);
        console.log('File on dir uploads has been deleted');
      }
    } else if (prevTatoe.imageId) {
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
          imageId: newImageId,
        },
      });
      const newTatoe = {
        ...tatoe,
        imageUrl: tatoe.imageId
          ? `${process.env.BACKEND_URL}tatoe/${tatoe.id}/explanation_image/${tatoe.imageId}`
          : null,
      };
      res.json({ data: newTatoe });

      // const createdAt = tatoe.createdAt;
      // const formattedCreatedAt = formatDate(createdAt, dateFormat);
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
        console.log(`${'\n\n'}=== DELETE ALL TATOE ===${'\n\n'}`, tatoe);

        res.json({ data: tatoe });
      } catch {
        throw Error('削除できませんでした');
      }
    }
  }
);

// 説明画像
router.get(
  '/:id/explanation_image/:imageId',
  async (req: express.Request, res: express.Response, next) => {
    const id = req.params.id; // tId
    const imageId = req.params.imageId;
    console.log(`${'\n\n'}=== GET imageId ===${'\n\n'}`, imageId);
    console.log(`${'\n\n'}=== GET tId ===${'\n\n'}`, id);

    const file = googleStorage
      .bucket(bucketName as string)
      .file(`tatoe_images/${id}/${imageId}`);
    const [exists] = await file.exists();
    console.log(`${'\n\n'}=== GET file exists ===${'\n\n'}`, exists);

    try {
      if (exists) {
        const stream = file.createReadStream();
        stream.on('error', (error) => {
          console.log(`GET Error ${error}`);
          res.statusCode = 500;
          res.end('500 error');
        });
        stream.pipe(res.header({ 'Content-Type': 'image/jpg' }));
      } else throw Error('画像がありません。');
    } catch (error) {
      console.error('GET IMAGE CATCH ERROR', error);
    }
  }
);

router.delete(
  '/:id/explanation_image',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response, next) => {
    const id = req.params.id; // tId
    const userId = (req.user as any).id;
    console.log('======DELETE tId', id); // undefined

    const prevTatoe = await prisma.tatoe.findUnique({
      where: { id },
    });
    if (!prevTatoe) {
      throw new Error('Tatoe not Found');
    }
    if (prevTatoe.userId !== userId) {
      throw new Error('本人以外画像を削除できません');
    }

    const file = googleStorage
      .bucket(bucketName as string)
      .file(`tatoe_images/${id}/${prevTatoe.imageId}`);

    const [exists] = await file.exists();

    if (exists) {
      await file.delete();
      console.log('File on GCS has been deleted');
    }

    const fixedTatoe = await prisma.tatoe.update({
      where: { id },
      data: {
        imageId: null,
      },
    });
    res.json({
      data: {
        ...fixedTatoe,
        imageUrl: null,
      },
    });
  }
);

export default router;
