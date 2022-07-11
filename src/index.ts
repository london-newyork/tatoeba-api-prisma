require('dotenv').config();
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2';

import passport from 'passport';
import { Strategy as StrategyLocal } from 'passport-local';
import { ExtractJwt, Strategy as StrategyJWT } from 'passport-jwt';

import express from 'express';
import { sendRegistrationAuthEmail } from './mailSender';
import { sendNoticeRegistrationAuthPassword } from './mailSenderCompleteRegistration';
import { PrismaClient } from '@prisma/client';

passport.use(
  new StrategyLocal((email, password, done) => {
    done(null, false); //ログイン成功時はfalseの部分がユーザー情報に書き換わる。失敗時はfalse
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
app.use(passport.initialize);

app.listen(3002, () => {
  console.log('Start on port 3002.');
});

const connection = mysql.createConnection(process.env.DATABASE_URL as string);

connection.connect();

const prisma = new PrismaClient();

//一覧取得
app.get('/users', (req: express.Request, res: express.Response) => {
  // res.send(JSON.stringify(users));

  connection.query('SELECT * FROM users', function (err, rows) {
    if (err) throw err;

    res.send(rows);
  });
});

app.post(
  '/registrations',
  async (req: express.Request, res: express.Response, next) => {
    // アクセスログ
    console.log(req.method, req.url, req.ip);

    // headerを表示
    console.log(req.headers);

    // bodyを表示
    console.log(req.body);

    //email
    console.log(req.body.email);

    // ここで登録処理などを行う
    //emailかどうかのチェックをする(@などが含まれているか=>フロントでもAPIでもする)
    const email = req.body.email;
    try {
      const registration = await prisma.registration.create({
        data: { email },
      });
      //ユーザーの入力したemailとtokenを受け取ったらメールが飛ぶ
      res.send({ registrationToken: registration.token });
      await sendRegistrationAuthEmail(registration.token, registration.email);
    } catch (err) {
      throw err;
      //エラーにはデータベースから返ってきた情報が含まれている。DBの情報が含まれているということはこの情報を利用して悪い人が攻撃をしてくる可能性がある。なにがあるかわからないので、DBから返ってきた情報はそのまま返すことはしない。
      //１こ目のエラーがメールのダブリ。其の場合はダブっているということを教えることが適切。
      //2こ目のエラーはDBがシャットダウンしてしまっているなどがあった場合は、純粋にエラーが発生しているということを知らせる（DBでエラー発生という表現はしない）
    }
  }
);

// フロントから渡ってきたトークンが登録されているトークンと同じかどうかを確認する
app.get(
  '/registrations',
  async (req: express.Request, res: express.Response, next) => {
    const token = req.body.token;
    const registration = await prisma.registration.findUnique({
      where: { token },
    });
    if (!registration) {
      throw new Error('Error: 存在しないTokenです');
    }
    res.json([registration]);
  }
);

app.put(
  '/registrations',
  (req: express.Request, res: express.Response, next) => {
    console.log('password', req.body.password);
    console.log('token', req.body.token);
    console.log('email', req.body.email);

    const email = req.body.email;
    const token = req.body.token;
    const rawPassword = req.body.password;
    const password = bcrypt.hash(rawPassword, 10);

    const id = '';
    const idToken = '';
    const accessToken = '';

    // フロントから渡ってきたパスワードとトークンをDBへ登録する
    const sql = 'INSERT INTO registrations (token,password) VALUES (? , ?)';
    // const registration = await prisma.registration.create({
    //   data:
    // });

    connection.query(sql, [token, password], async (err) => {
      if (err) throw err;

      // //本登録されたことをユーザーにお知らせ？
      // await sendNoticeRegistrationAuthPassword(email);
      res.send({ id, idToken, accessToken }); //これをどうするか？
    });
  }
);

//認証用のURLにアクセスしたユーザーのメールアドレスを取得
//新しいエンドポイントを作る
app.get(
  '/confirmEmail',
  async (req: express.Request, res: express.Response, next) => {
    const token = req.query.token as string;
    //ユーザーのメールアドレスが確認できたとき、メールアドレスのパラメータ付きのURLへリダイレクト
    const email = req.body.email as string;
    try {
      await prisma.registration.update({
        where: { token, email, confirmedAt: null }, //既に確認された人はここでエラーになる
        data: { confirmedAt: new Date() },
      });
      res.redirect(`${process.env.FRONTEND_URL}registrations/?email=${email}`);
    } catch (err) {
      throw err;
      //エラーの場合はエラーページへ遷移する
    }
  }
);

//usersテーブルにemailとpasswordを保存する
app.post('/users', (req: express.Request, res: express.Response, next) => {
  //email
  console.log(req.body.email);

  // ここで登録処理などを行う
  const email = req.body.email;
  const rawPassword = req.body.password;
  //passwordは平文じゃないようにする＝>ライブラリに頼る　passportなど
  const password = bcrypt.hash(rawPassword, 10);
  const token = req.body.token;
  //emailが確認済みか確認する(確認済みフラグあるか)=>フラグはどこに作るのか

  //usersテーブルにemailとpasswordを保存する
  const sql = `UPDATE users SET email = ${email}, password = ${password} WHERE token = ${token}`;
  connection.query(sql, [email, password, token], async (err) => {
    if (err) throw err;

    //ユーザーの入力したemailとtokenを受け取ったら登録完了メールが飛ぶ
    res.send();
    await sendNoticeRegistrationAuthPassword(email);
  });
});
