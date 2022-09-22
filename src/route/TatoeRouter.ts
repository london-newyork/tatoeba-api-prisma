import express from 'express';
import passport from 'passport';
import { RequestUser } from '../@types/express';
import { prisma } from '../prisma';
import { DateFormat, dateFormat, formatDate, FormattedDate } from '../date';
const router = express.Router();

router.get('/', async (req: express.Request, res: express.Response) => {
  const tatoe = await prisma.tatoe.findMany({
    take: 100,
    orderBy: {
      createdAt: 'desc',
    },
  });
  console.log(tatoe);

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

export default router;
