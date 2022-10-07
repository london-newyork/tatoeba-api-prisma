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
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const prisma_1 = require("../prisma");
const mailSenderCompleteRegistration_1 = require("../mailSenderCompleteRegistration");
const bcrypt = require('bcrypt');
const router = express_1.default.Router();
router.post('/login', passport_1.default.authenticate('local', {
    session: false,
}), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // 1 jwtのtokenを作成 passwordはペイロードに含めない
    const user = req.user;
    const payload = { email: user.email, id: user.id };
    const userId = payload.id;
    const token = jsonwebtoken_1.default.sign(payload, process.env.STRATEGYJWT_SECRET_KEY, {
        expiresIn: '12h',
    });
    res.json({ token, userId });
    //12h以降のrefreshTokenを用意する。
}));
// password再設定の際にjwtがあるか確認してからページにアクセスさせる
router.post('/password_reset', passport_1.default.authenticate('jwt', { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    // currentPassword, newPasswordをボディから抽出
    const { currentPassword, newPassword } = req.body;
    // userId を用いてユーザーデータをDBから取得する なかったらエラーになるようにする
    const user = yield prisma_1.prisma.user.findUniqueOrThrow({
        where: { id: userId },
    });
    // 現在のユーザーのパスワード(user.password)と currentPassword を比較する
    if (!currentPassword) {
        throw new Error('現在のパスワードが不正です');
    }
    const isOK = yield bcrypt.compare(currentPassword, user === null || user === void 0 ? void 0 : user.password);
    if (!isOK) {
        throw new Error('現在のパスワードが不正です');
    }
    // newPassword を暗号化し、DBに保存する
    const password = yield bcrypt.hash(newPassword, 10);
    yield prisma_1.prisma.user.update({
        where: { id: userId },
        data: { password: password },
    });
    res.json({ message: 'パスワード変更完了しました' });
}));
//本登録のフォームでパスワードとトークンをDBへ登録する
router.post('/set_password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.body.token;
    const rawPassword = req.body.password;
    const password = yield bcrypt.hash(rawPassword, 10);
    // フロントから渡ってきたパスワードとトークンをDBへ登録する
    yield prisma_1.prisma.$transaction((p) => __awaiter(void 0, void 0, void 0, function* () {
        const registration = yield p.registration.findUnique({
            where: { token },
        });
        if (!registration) {
            throw new Error('登録データが見つかりません。');
        }
        const user = yield p.user.create({
            data: { password, email: registration.email },
        });
        yield (0, mailSenderCompleteRegistration_1.sendNoticeRegistrationAuthPassword)(user.email);
    }));
    res.send();
}));
exports.default = router;
