"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const passport_1 = require("./passport");
const express_1 = __importDefault(require("express"));
const mailSender_1 = require("./mailSender");
const email_validator_1 = require("email-validator");
const prisma_1 = require("../src/prisma");
const AuthRouter_1 = __importDefault(require("./route/AuthRouter"));
const UserRouter_1 = __importDefault(require("./route/UserRouter"));
const TatoeRouter_1 = __importDefault(require("./route/TatoeRouter"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
//CORS対応（というか完全無防備：本番環境ではだめ絶対）
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});
app.use(passport_1.passport.initialize());
// routerを追加
app.use('/auth', AuthRouter_1.default);
app.use('/users', UserRouter_1.default);
app.use('/tatoe', TatoeRouter_1.default);
app.listen(3003, () => {
    console.log('Start on port 3003.');
});
// 画像登録で必要
app.use(express_1.default.static(path_1.default.join(__dirname, 'uploads')));
//仮登録時にユーザーがメールアドレスを登録する
app.post('/registrations', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // ここで登録処理などを行う
    //emailかどうかのチェックをする(@などが含まれているか=>フロントでもAPIでもする)
    const email = req.body.email;
    if (!(0, email_validator_1.validate)(email)) {
        // メールアドレスの形式が正しくない時
        throw new Error('データが不正です。');
    }
    try {
        const registration = yield prisma_1.prisma.registration.create({
            data: { email },
        });
        res.send({ registrationToken: registration.token });
        yield (0, mailSender_1.sendRegistrationAuthEmail)(registration.token, registration.email);
    }
    catch (err) {
        throw err;
    }
}));
// 受け取ったURLから、ユーザーが本登録の操作画面へ移る。
// システムは、フロントから渡ってきたトークンが登録されているトークンと同じかどうかを確認し、
// 本登録のフォームへ遷移。
app.get('/registrations', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = String(req.query.token);
    const registration = yield prisma_1.prisma.registration.findUnique({
        where: { token },
    });
    if (!registration) {
        throw new Error('Error: 存在しないTokenです');
    }
    yield res.redirect(`${process.env.FRONTEND_TOP_URL}RegisterMember/CompleteRegisterMemberForm/?token=${token}`);
}));
//認証用のURLにアクセスしたユーザーのメールアドレスを取得
//新しいエンドポイントを作る
app.get('/confirmEmail', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.query.token;
    //ユーザーのメールアドレスが確認できたとき、メールアドレスのパラメータ付きのURLへリダイレクト
    const email = req.body.email;
    try {
        const registration = yield prisma_1.prisma.registration.findUnique({
            where: { token },
        });
        if (!registration) {
            throw new Error('データの登録がありません。');
        }
        if (!(registration === null || registration === void 0 ? void 0 : registration.confirmedAt)) {
            throw new Error(',...');
        }
        else {
            yield prisma_1.prisma.registration.update({
                where: { token, email },
                data: { confirmedAt: new Date() },
            });
            res.redirect(`${process.env.FRONTEND_URL}registrations/?email=${email}`);
        }
    }
    catch (err) {
        throw err;
    }
}));
