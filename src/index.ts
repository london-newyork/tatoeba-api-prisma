// import express from 'express';
// const app: express.Express = express();
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// //CROS対応（というか完全無防備：本番環境ではだめ絶対）
// app.use(
//   (req: express.Request, res: express.Response, next: express.NextFunction) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', '*');
//     res.header('Access-Control-Allow-Headers', '*');
//     next();
//   }
// );

// app.listen(3002, () => {
//   console.log('Start on port 3002.');
// });

// type User = {
//   id: number;
//   name: string;
//   email: string;
// };

// const users: User[] = [
//   { id: 1, name: 'User1', email: 'user1@test.local' },
//   { id: 2, name: 'User2', email: 'user2@test.local' },
//   { id: 3, name: 'User3', email: 'user3@test.local' },
//   { id: 4, name: 'User4', email: 'user4@test.local' },
// ];

// //一覧取得
// app.get('/users', (req: express.Request, res: express.Response) => {
//   res.send(JSON.stringify(users));
// });
