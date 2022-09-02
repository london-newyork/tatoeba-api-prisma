import express from 'express';
import passport from 'passport';
import { RequestUser } from '../@types/express';
import { prisma } from '../prisma';
import { DateFormat, dateFormat, formatDate, FormattedDate } from '../date';
const router = express.Router();

// TODO GET /totae -> 全ての人の tatoe 一覧

router.get('/', async (req: express.Request, res: express.Response) => {
  const tatoe = await prisma.tatoe.findMany({
    take: 100,
    orderBy: {
      createdAt: 'desc',
    },
  });
  res.json({ tatoe });
});

//  TODO GET /totae/hoge -> id が hoge の tatoe を取得
// /tatoe/:id => userIdをフロントから運んでもらう

//  TODO POST /totae -> 自分の tatoe を作成
//  TODO 整形したformatDateをどこで適用するべきか考え中

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

//  TODO DELETE /tatoe/hoge -> id が hoge の tatoe を削除（自分が作ったもののみ許可）
export default router;
