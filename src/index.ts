require('dotenv').config();
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2';
import { getMaxListeners } from 'process';
// import 'dotenv/config';
import express from 'express';
import { sendRegistrationAuthEmail } from './mailSender';

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

app.post('/registrations', (req, res, next) => {
  // アクセスログ
  console.log(req.method, req.url, req.ip);

  // headerを表示
  console.log(req.headers);

  // bodyを表示
  console.log(req.body);

  // ここで登録処理などを行う
  const token = uuidv4();
  const sql = 'INSERT INTO registrations (token,email) VALUES (? , ?)';
  connection.query(sql, [token, req.body.email], function (err) {
    if (err) throw err;
    res.send({ registrationToken: token });
    //tokenを受け取ったらメールが飛ぶ
    sendRegistrationAuthEmail(token);
  });
});

//ユーザーがメールを受け取り、URLを踏み、認証画面でpasswordを入力して登録完了となる。
//その際必要なのがusersテーブル、token => tokenをurlからどうやって抽出する？
app.get('/*', function (req, res) {
  res.contentType('text/plain; charset=utf-8');
  const url = req.originalUrl;
  const attachedToken = url.replace(
    'http://localhost:3000/registrations/complete/',
    ''
  );
  res.end();
});

app.put('/users', (req, res, next) => {
  // ここで登録完了処理をする
  const sql = 'SELECT token, email FROM registrations';

  //attachedTokenを参照できない
  connection.query(sql, [attachedToken, req.body.email], function (err) {
    if (err) throw err;
    // if (attachedToken) {
    //   res.send({});
    // }
  });
});
