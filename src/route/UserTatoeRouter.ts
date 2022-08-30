import express from 'express';
import passport from 'passport';
import { RequestUser } from '../@types/express';
import { prisma } from '../prisma';

const router = express.Router();

// ユーザーの例え一覧取得
// これで (/users)/:userId/tatoe　のはず
router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    const id = req.params.userId;
    const userId = (req.user as RequestUser)?.id;

    if (userId === id) {
      const userTatoe = await prisma.tatoe.findMany({
        where: { userId: id },
      });
      console.log('userTatoe :', userTatoe);

      res.json({ data: userTatoe });
    } else {
      res.json({ data: [] });
    }
  }
);

export default router;
