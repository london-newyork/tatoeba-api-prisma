require('dotenv').config();
// import 'dotenv/config';
import express from 'express';
const app: express.Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//CROS対応（というか完全無防備：本番環境ではだめ絶対）
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

import mysql from 'mysql2';
import { getMaxListeners } from 'process';
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

  connection.query(
    'INSERT INTO users (email) VALUES ("testtest@gmail.com")',
    function (err, rows) {
      if (err) throw err;
      console.log(res);

      res.send(rows);
    }
  );
  res.send({ registrationToken: req.body.email });
});
