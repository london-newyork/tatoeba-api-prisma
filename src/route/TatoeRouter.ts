import express from 'express';
import passport from 'passport';
import { prisma } from '../prisma';

const router = express.Router();

// TODO GET /totae -> 全ての人の tatoe 一覧

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    const tatoe = await prisma.tatoe.findMany({
      take: 100,
      select: {
        id: true,
        user: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json({ tatoe });
  }
);

//  TODO GET /totae/hoge -> id が hoge の tatoe を取得
// /tatoe/:id => userIdをフロントから運んでもらう

//  TODO POST /totae -> 自分の tatoe を作成

//  TODO PUT /tatoe/hoge -> id が hoge の tatoe を更新（作成者が自分自身）

//  TODO DELETE /tatoe/hoge -> id が hoge の tatoe を削除（自分が作ったもののみ許可）
export default router;
