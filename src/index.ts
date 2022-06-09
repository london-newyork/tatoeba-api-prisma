require('dotenv').config();
import { v4 as uuidv4 } from 'uuid';
import mysql from 'mysql2';
import { getMaxListeners } from 'process';
// import 'dotenv/config';
import express from 'express';
import { useMailToUser } from './hooks/useMailToUser';

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
    useMailToUser(token);
  });
});

// app.put('/registrations', (req, res, next) => {
//   // ここで登録完了処理をする
//   const sql = 'INSERT INTO registrations (token,email) VALUES (? , ?)';
//   connection.query(sql, [token, req.body.email], function (err) {
//     if (err) throw err;
//     // if (token) {
//     //   res.send({});
//     // }
//   });
// });
