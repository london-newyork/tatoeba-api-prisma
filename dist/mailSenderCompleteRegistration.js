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
exports.sendNoticeRegistrationAuthPassword = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const classes_1 = require("@sendgrid/helpers/classes");
require('dotenv').config();
const sendNoticeRegistrationAuthPassword = (email) => __awaiter(void 0, void 0, void 0, function* () {
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
        subject: '新規会員登録完了',
        text: [
            'Tatoeba事務局でございます。',
            'ご本人確認ができましたため、新規会員登録が完了いたしました。',
            '引き続きTatoebaをお楽しみください。',
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
exports.sendNoticeRegistrationAuthPassword = sendNoticeRegistrationAuthPassword;
