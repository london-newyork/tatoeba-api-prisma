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
exports.sendRegistrationAuthEmail = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const classes_1 = require("@sendgrid/helpers/classes");
require('dotenv').config();
const sendRegistrationAuthEmail = (token, email) => __awaiter(void 0, void 0, void 0, function* () {
    mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
    const message = {
        from: {
            name: 'Tatoeba事務局',
            email: process.env.EMAIL_FROM,
        },
        to: {
            name: '宛先',
            email: email,
        },
        bcc: [process.env.EMAIL_BCC],
        subject: '新規会員登録(仮)',
        text: [
            'この度は新規会員登録をしていただき、誠にありがとうございます。',
            'お手数ですが、以下のURLから会員登録完了ページへ遷移し、会員登録を完了させていただけますようお願い申し上げます。',
            '万が一メールにお心当たりのない場合は、破棄していただけますようお願いいたします。',
            `${process.env.BACKEND_URL}registrations/?token=${token}`,
        ].join('\n'),
    };
    try {
        const response = yield mail_1.default.send(message);
        console.info(JSON.stringify(response, null, 2));
    }
    catch (err) {
        console.error(err);
        if (err instanceof classes_1.ResponseError) {
            console.debug(JSON.stringify(err.response.body, null, 2));
        }
    }
});
exports.sendRegistrationAuthEmail = sendRegistrationAuthEmail;
