require('dotenv').config();
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2';
import { getMaxListeners } from 'process';
// import 'dotenv/config';
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

type User = {
  id: number;
  name: string;
  email: string;
};

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
    const email = req.body.email;
    const sql = 'INSERT INTO registrations (token,email) VALUES (? , ?)';
    connection.query(sql, [token, email], async (err) => {
      if (err) throw err;

      //ユーザーの入力したemailとtokenを受け取ったらメールが飛ぶ
      res.send({ registrationToken: token });
      // const registrationToken = res.body.registrationToken;
      await sendRegistrationAuthEmail(token, email); //tokenではなくregistrationToken？
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
    const registrationToken = req.body.token;
    const rawPassword = req.body.password;
    const password = bcrypt.hash(rawPassword, 10);

    // フロントから渡ってきたパスワードとトークンをDBへ登録する
    //token => registrationToken ？DBにはそういうカラムはない
    const sql = 'INSERT INTO registrations (token,password) VALUES (? , ?)';
    connection.query(sql, [registrationToken, password], async (err) => {
      if (err) throw err;

      //本登録されたことをユーザーにお知らせ
      await sendNoticeRegistrationAuthPassword(email);
      // res.send({ id, idToken, accessToken });
    });
  }
);
