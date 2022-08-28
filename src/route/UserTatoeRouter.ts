import express from 'express';
import passport from 'passport';
import { RequestUser } from '../@types/express';
import { prisma } from '../prisma';

// TODO GET /users/userId/totae -> userId A の tatoe 一覧が取得できるようにする

const router = express.Router();

// ユーザーの例え一覧取得
// これで (/users)/:id/tatoe　のはず
// tatoeとして取得するか個別に title shortParaphrase description?

router.get(
  '/tatoe',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    const id = req.params.id;
    console.log('(/users)/:id/tatoe : id', id);
    const userId = (req.user as RequestUser)?.id;

    if (userId === id) {
      const userTatoe = await prisma.user.findUnique({
        where: { id },
        include: { tatoe: true },
      });
      console.log('userTatoe :', userTatoe);

      res.json({ data: userTatoe });
    }
  }
);

export default router;
