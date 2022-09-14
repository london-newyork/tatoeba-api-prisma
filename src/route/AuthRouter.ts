import { User } from '@prisma/client';
import express from 'express';

import jwt from 'jsonwebtoken';
import passport from 'passport';
import { prisma } from '../prisma';

import { sendNoticeRegistrationAuthPassword } from '../mailSenderCompleteRegistration';

const bcrypt = require('bcrypt');

const router = express.Router();

router.post(
  '/login',
  passport.authenticate('local', {
    session: false,
  }),
  async (req: express.Request, res: express.Response, next) => {
    // 1 jwtのtokenを作成 passwordはペイロードに含めない
    const user = req.user as User;
    const payload = { email: user.email, id: user.id };
    const userId = payload.id;

    const token = jwt.sign(
      payload,
      process.env.STRATEGYJWT_SECRET_KEY as string,
      {
        expiresIn: '12h',
      }
    );
    res.json({ token, userId });
    //12h以降のrefreshTokenを用意する。
  }
);

// password再設定の際にjwtがあるか確認してからページにアクセスさせる
router.post(
  '/password_reset',
  passport.authenticate('jwt', { session: false }),
  async (req: express.Request, res: express.Response) => {
    const userId = (req.user as any).id;

    // currentPassword, newPasswordをボディから抽出
    const { currentPassword, newPassword } = req.body;

    // userId を用いてユーザーデータをDBから取得する なかったらエラーになるようにする
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    // 現在のユーザーのパスワード(user.password)と currentPassword を比較する
    if (!currentPassword) {
      throw new Error('現在のパスワードが不正です');
    }
    const isOK = await bcrypt.compare(currentPassword, user?.password);
    if (!isOK) {
      throw new Error('現在のパスワードが不正です');
    }

    // newPassword を暗号化し、DBに保存する
    const password = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: password },
    });

    res.json({ message: 'パスワード変更完了しました' });
  }
);

//本登録のフォームでパスワードとトークンをDBへ登録する
router.post(
  '/set_password',
  async (req: express.Request, res: express.Response) => {
    const token = req.body.token;
    const rawPassword = req.body.password;
    const password = await bcrypt.hash(rawPassword, 10);

    // フロントから渡ってきたパスワードとトークンをDBへ登録する
    await prisma.$transaction(async (p) => {
      const registration = await p.registration.findUnique({
        where: { token },
      });
      if (!registration) {
        throw new Error('登録データが見つかりません。');
      }
      const user = await p.user.create({
        data: { password, email: registration.email },
      });
      await sendNoticeRegistrationAuthPassword(user.email);
    });
    res.send();
  }
);

export default router;
