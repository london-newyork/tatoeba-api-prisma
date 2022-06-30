require('dotenv').config();
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2';

import express from 'express';
import { sendRegistrationAuthEmail } from './mailSender';
import { sendNoticeRegistrationAuthPassword } from './mailSenderCompleteRegistration';

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

app.listen(3002, () => {
  console.log('Start on port 3002.');
});

const connection = mysql.createConnection(process.env.DATABASE_URL as string);

connection.connect();

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
  (req: express.Request, res: express.Response, next) => {
    // アクセスログ
    console.log(req.method, req.url, req.ip);

    // headerを表示
    console.log(req.headers);

    // bodyを表示
    console.log(req.body);

    //email
    console.log(req.body.email);

    // ここで登録処理などを行う
    const token = uuidv4();
    //emailのサーバー側バリデーション？
    const email = req.body.email;
    const sql = 'INSERT INTO registrations (token,email) VALUES (? , ?)';
    connection.query(sql, [token, email], async (err) => {
      if (err) throw err;

      //ユーザーの入力したemailとtokenを受け取ったらメールが飛ぶ
      res.send({ registrationToken: token });
      await sendRegistrationAuthEmail(token, email);
    });
  }
);

// フロントから渡ってきたトークンが登録されているトークンと同じかどうかを確認する
app.get(
  '/registrations',
  (req: express.Request, res: express.Response, next) => {
    const token = req.body.token;

    const sql = `SELECT * FROM registrations WHERE token IN (${token});`;
    connection.query(sql, [token], async (err, rows) => {
      if (err) throw err;
      console.log('token存在チェック結果', rows);

      res.send(rows);
      //NGパターン
      // const exists = rows[sql];
      // return exists;
      // const isToken = rows.length;
      // res.send({ isToken });
    });
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
  (req: express.Request, res: express.Response, next) => {
    //tokenをどうする？
    const token = req.query.token;
    //ユーザーのメールアドレスが確認できたとき、メールアドレスのパラメータ付きのURLへリダイレクト
    const email = req.body.email;
    if (email) {
      res.redirect(`${process.env.FRONTEND_URL}registrations/?email=${email}`);
    }
    //確認済みフラグをかく

    //エラー時対応
    //SQL文は何を書くのか？
    const sql = '';
    connection.query(sql, function (err) {
      if (err) throw err;
      //エラーページへリダイレクトをする
      res.redirect(`${process.env.FRONTEND_URL}registrations/error`);
    });
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
