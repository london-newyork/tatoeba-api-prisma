require('dotenv').config();

import passport from 'passport';
import { Strategy as StrategyLocal } from 'passport-local';
import { ExtractJwt, Strategy as StrategyJWT } from 'passport-jwt';

import express from 'express';
import { sendRegistrationAuthEmail } from './mailSender';
import { sendNoticeRegistrationAuthPassword } from './mailSenderCompleteRegistration';
import { PrismaClient } from '@prisma/client';
import { validate } from 'email-validator';
import { prisma } from '../src/prisma';
//仮設定
import AuthRouter from './route/AuthRouter';
// import B_Router from '';
// import C_Router from '';

passport.use(
  new StrategyLocal((email: string, password: string, done) => {
    if (email && password) {
      return done(null, email && password); //ログイン成功時はfalseの部分がユーザー情報に書き換わる。失敗時はfalse
    } else {
      return done(null, false, {
        message: '入力情報が間違っています。',
      });
    }
  })
);

passport.use(
  new StrategyJWT(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.STRATEGYJWT_SECRET_KEY,
    },
    (payload, done) => {
      done(null, payload);
    }
  )
);
const app: express.Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const bcrypt = require('bcrypt');
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
app.use('/auth', AuthRouter); // /authから始まるURL
// app.use('/b', B_Router);
// app.use('/c', passport.authenticate('jwt', { session: false }, C_Router));

app.listen(3003, () => {
  console.log('Start on port 3003.');
});

//一覧取得
app.get('/users', async (req: express.Request, res: express.Response) => {
  const users = await prisma.user.findMany({
    take: 10,
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json({ users });
});

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
      //ユーザーの入力したemailとtokenを受け取ったら仮登録メールが飛ぶ
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
    const token = req.query.token;
    const registration = await prisma.registration.findUnique({
      where: { token },
    });
    if (!registration) {
      throw new Error('Error: 存在しないTokenです');
    }
    await res.redirect(
      `${process.env.FRONTEND_TOP_URL}RegisterMember/CompleteRegisterMemberForm/?token=${token}`
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
      // update を行う前にすでに　confirmedAt が null ではないか、DBから取得をして確認する
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
          where: { token, email }, //既に確認された人はここでエラーになる
          data: { confirmedAt: new Date() },
        });
        res.redirect(
          `${process.env.FRONTEND_URL}registrations/?email=${email}`
        );
      }
    } catch (err) {
      throw err;
      //エラーの場合はエラーページへ遷移する
    }
  }
);

//本登録のフォームでパスワードとトークンをDBへ登録する
app.post(
  '/auth/set_password',
  async (req: express.Request, res: express.Response) => {
    console.log('token', req.body.token);

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
