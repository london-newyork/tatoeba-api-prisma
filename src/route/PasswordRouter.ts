import { User } from '@prisma/client';
import express from 'express';
import { prisma } from '../../src/prisma';
import jwt from 'jsonwebtoken';
import passport from 'passport';

const router = express.Router();

// currentPassword newPasswordがフロントからやってくる
router.post(
  '/reset',
  passport.authenticate('jwt', {
    session: false,
  }),
  async (req, res, next) => {
    const user = req.user as User;
    const currentPassword = user.password;

    const password = await prisma.user.findFirst({
      where: { password: currentPassword },
    });
    if (!password) {
      throw new Error('不正な入力です');
    }
    // currentPasswordがDBのpasswordと一致したらnewPasswordを登録
    await prisma.user.create({
      data: {
        password: newPassword,
      },
    });
    await res.redirect(
      `${process.env.FRONTEND_TOP_URL}/reset_password_success`
    );
    res.json({});
  }
);

export default router;
