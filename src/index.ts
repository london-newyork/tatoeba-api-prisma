require('dotenv').config();

import { passport } from './passport';

import express from 'express';
import { sendRegistrationAuthEmail } from './mailSender';

import { validate } from 'email-validator';
import { prisma } from './prisma';
import AuthRouter from './route/AuthRouter';
import UserRouter from './route/UserRouter';
import TatoeRouter from './route/TatoeRouter';
import path from 'path';

const app: express.Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//CORS対応（というか完全無防備：本番環境ではだめ絶対）
app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
  }
);
app.use(passport.initialize());

// routerを追加
app.use('/auth', AuthRouter);
app.use('/users', UserRouter);
app.use('/tatoe', TatoeRouter);
app.listen(3003, () => {
  console.log('Start on port 3003.');
});

// 画像登録で必要
app.use(express.static(path.join(__dirname, 'uploads')));

//仮登録時にユーザーがメールアドレスを登録する
app.post(
  '/registrations',
  async (req: express.Request, res: express.Response) => {
    // ここで登録処理などを行う
    //emailかどうかのチェックをする(@などが含まれているか=>フロントでもAPIでもする)
    const email = req.body.email;
    if (!validate(email)) {
      // メールアドレスの形式が正しくない時
      throw new Error('データが不正です。');
    }
    try {
      const registration = await prisma.registration.create({
        data: { email },
      });
      res.send({ registrationToken: registration.token });
      await sendRegistrationAuthEmail(registration.token, registration.email);
    } catch (err) {
      throw err;
    }
  }
);

// 受け取ったURLから、ユーザーが本登録の操作画面へ移る。
// システムは、フロントから渡ってきたトークンが登録されているトークンと同じかどうかを確認し、
// 本登録のフォームへ遷移。
app.get(
  '/registrations',
  async (req: express.Request, res: express.Response) => {
    const token = String(req.query.token);
    const registration = await prisma.registration.findUnique({
      where: { token },
    });
    if (!registration) {
      throw new Error('Error: 存在しないTokenです');
    }
    await res.redirect(
      `${process.env.FRONTEND_TOP_URL}register-member/complete-register-member-form/?token=${token}`
    );
  }
);

//認証用のURLにアクセスしたユーザーのメールアドレスを取得
//新しいエンドポイントを作る
app.get(
  '/confirmEmail',
  async (req: express.Request, res: express.Response) => {
    const token = req.query.token as string;
    //ユーザーのメールアドレスが確認できたとき、メールアドレスのパラメータ付きのURLへリダイレクト
    const email = req.body.email as string;
    try {
      const registration = await prisma.registration.findUnique({
        where: { token },
      });
      if (!registration) {
        throw new Error('データの登録がありません。');
      }
      if (!registration?.confirmedAt) {
        throw new Error(',...');
      } else {
        await prisma.registration.update({
          where: { token, email },
          data: { confirmedAt: new Date() },
        });
        res.redirect(
          `${process.env.FRONTEND_URL}registrations/?email=${email}`
        );
      }
    } catch (err) {
      throw err;
    }
  }
);
