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
const passport_1 = __importDefault(require("passport"));
const prisma_1 = require("../prisma");
const UserTatoeRouter_1 = __importDefault(require("../route/UserTatoeRouter"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const googleCloudStorage_1 = require("../googleCloudStorage");
const router = express_1.default.Router();
// (/users)/:userId/tatoe/:tatoeId
router.use('/', UserTatoeRouter_1.default);
//一覧取得
router.get('/', passport_1.default.authenticate('jwt', { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // 本当は他のユーザーの情報はみられないようにする
    const users = yield prisma_1.prisma.user.findMany({
        take: 10,
        orderBy: {
            createdAt: 'desc',
        },
    });
    res.json({ users });
}));
router.get('/:id', passport_1.default.authenticate('jwt', { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = req.params.id;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (userId === id) {
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                userName: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json({ data: user });
    }
    else {
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                userName: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.json({ data: user });
    }
}));
// userNameを登録する
router.put('/:id', passport_1.default.authenticate('jwt', { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const id = req.params.id;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    const userName = req.body.userName;
    if (userId === id) {
        try {
            const updatedData = yield prisma_1.prisma.user.update({
                where: { id },
                data: { userName },
            });
            res.json({ updatedData });
        }
        catch (err) {
            throw err;
        }
    }
}));
// アバター読み込み
router.get('/:id/profile_image', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const file = googleCloudStorage_1.googleStorage
        .bucket(googleCloudStorage_1.bucketName)
        .file(`user_images/${id}`);
    const [exists] = yield file.exists();
    if (exists) {
        const stream = file.createReadStream();
        stream.on('error', (error) => {
            console.log(`${error}`);
            res.statusCode = 500;
            res.end('500 error');
        });
        stream.pipe(res);
    }
    else {
        const filePath = path_1.default.join(process.cwd(), 'assets/default_avatar.png');
        const stream = (0, fs_1.createReadStream)(filePath);
        stream.on('error', (error) => {
            console.log(`${error}`);
            res.statusCode = 500;
            res.end('500 error');
        });
        stream.pipe(res);
    }
}));
// アバター登録
router.put('/:id/profile_image', passport_1.default.authenticate('jwt', { session: false }), googleCloudStorage_1.upload.single('image'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const id = req.params.id;
    const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id;
    const file = req.file;
    if (userId === id) {
        if (file && googleCloudStorage_1.bucketName) {
            try {
                const data = yield googleCloudStorage_1.googleStorage
                    .bucket(googleCloudStorage_1.bucketName)
                    .upload(`${file.path}`, {
                    gzip: true,
                    destination: `user_images/${userId}`,
                });
                res.json({ data });
                console.log('data', data);
            }
            finally {
                yield (0, promises_1.unlink)(file.path);
                console.log('File has been deleted');
            }
        }
        else {
            console.log('There are no file and bucketName');
            next();
        }
    }
}));
exports.default = router;
