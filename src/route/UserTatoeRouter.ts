import express from 'express';
import passport from 'passport';
import { RequestUser } from '../@types/express';
import { prisma } from '../prisma';

const router = express.Router();

// ユーザーの例え一覧取得
router.get(
  '/:userId/tatoe',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    const id = req.params.userId;
    const userId = (req.user as RequestUser)?.id;
    console.log('@UserRouter GET userId', id);

    if (userId === id) {
      const userTatoe = await prisma.tatoe.findMany({
        where: { userId: id },
      });

      const newUserTatoe = userTatoe.map((prevTatoe) => {
        const id = prevTatoe.id;
        const userId = prevTatoe.userId;
        const imageId = prevTatoe.imageId;
        const title = prevTatoe.title;
        const shortParaphrase = prevTatoe.shortParaphrase;
        const description = prevTatoe.description;
        const createdAt = prevTatoe.createdAt;
        const updatedAt = prevTatoe.updatedAt;
        const imageUrl = prevTatoe.imageId
          ? `${process.env.BACKEND_URL}tatoe/${prevTatoe.id}/explanation_image/${prevTatoe.imageId}`
          : null;
        return {
          id,
          userId,
          imageId,
          title,
          shortParaphrase,
          description,
          createdAt,
          updatedAt,
          imageUrl,
        };
      });

      res.json({ data: newUserTatoe });
    } else {
      res.json({ data: [] });
    }
  }
);

export default router;
