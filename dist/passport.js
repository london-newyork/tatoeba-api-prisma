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
exports.passport = void 0;
const passport_1 = __importDefault(require("passport"));
exports.passport = passport_1.default;
const prisma_1 = require("../src/prisma");
const passport_local_1 = require("passport-local");
const passport_jwt_1 = require("passport-jwt");
const bcrypt = require('bcrypt');
passport_1.default.use(new passport_local_1.Strategy({ usernameField: 'email', session: false }, (email, password, done) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        return done(new Error('ログイン情報が正しくありません。1'), null);
    }
    const isOK = yield bcrypt.compare(password, user === null || user === void 0 ? void 0 : user.password);
    if (isOK) {
        return done(null, user); //ログイン成功時はfalseの部分がユーザー情報に書き換わる。失敗時はfalse
    }
    else {
        return done(new Error('ログイン情報が正しくありません。2'), null);
    }
})));
passport_1.default.use(new passport_jwt_1.Strategy({
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.STRATEGYJWT_SECRET_KEY,
}, (payload, done) => {
    done(null, payload);
}));
