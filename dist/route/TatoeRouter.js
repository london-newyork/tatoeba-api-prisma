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
const promises_1 = require("fs/promises");
const googleCloudStorage_1 = require("../googleCloudStorage");
const nanoid_1 = require("nanoid");
const router = express_1.default.Router();
// 全員の分
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tatoe = yield prisma_1.prisma.tatoe.findMany({
        take: 100,
        orderBy: {
            createdAt: 'desc',
        },
        include: {
            user: {
                select: {
                    userName: true,
                    id: true,
                },
            },
        },
    });
    const newUserTatoe = tatoe.map((item) => {
        return {
            id: item.id,
            userId: item.userId,
            imageId: item.imageId,
            title: item.title,
            shortParaphrase: item.shortParaphrase,
            description: item.description,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            user: { userName: item.user.userName, id: item.user.id },
            imageUrl: item.imageId
                ? `${process.env.BACKEND_URL}tatoe/${item.id}/explanation_image/${item.imageId}`
                : null,
        };
    });
    res.json({ data: newUserTatoe });
}));
// Search Result
router.get('/:tId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tId = req.params.tId;
    const tatoe = yield prisma_1.prisma.tatoe.findUnique({
        where: { id: tId },
    });
    const newTatoe = Object.assign(Object.assign({}, tatoe), { imageUrl: (tatoe === null || tatoe === void 0 ? void 0 : tatoe.imageId)
            ? `${process.env.BACKEND_URL}tatoe/${tatoe === null || tatoe === void 0 ? void 0 : tatoe.id}/explanation_image/${tatoe.imageId}`
            : null });
    res.json({ data: newTatoe });
}));
router.post('/', passport_1.default.authenticate('jwt', { session: false }), googleCloudStorage_1.upload.single('image'), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { title, shortParaphrase, description } = req.body;
    const file = req.file;
    console.log('==== POST file', file);
    const imageId = file ? (0, nanoid_1.nanoid)() : null;
    const tatoe = yield prisma_1.prisma.tatoe.create({
        data: {
            userId,
            title,
            shortParaphrase,
            description,
            imageId,
        },
    });
    if (file && googleCloudStorage_1.bucketName) {
        try {
            yield googleCloudStorage_1.googleStorage
                .bucket(googleCloudStorage_1.bucketName)
                .upload(`${file.path}`, {
                gzip: true,
                destination: `tatoe_images/${tatoe.id}/${tatoe.imageId}`,
            });
        }
        finally {
            yield (0, promises_1.unlink)(file.path);
            console.log('File on dir uploads has been deleted');
        }
    }
    else {
        console.log('There are no file or bucketName');
    }
    const newTatoe = Object.assign(Object.assign({}, tatoe), { imageUrl: imageId
            ? `${process.env.BACKEND_URL}tatoe/${tatoe.id}/explanation_image/${imageId}`
            : null });
    res.json({ data: newTatoe });
    // const createdAt = tatoe.createdAt;
    // const formattedCreatedAt = formatDate(createdAt, dateFormat);
}));
// 自分のtatoe更新
router.put('/:id', passport_1.default.authenticate('jwt', { session: false }), googleCloudStorage_1.upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    const id = req.params.id;
    const { title, shortParaphrase, description } = req.body;
    const file = req.file;
    console.log(`${'\n\n'}=== PUT :id(tId) ===${'\n\n'}`, id);
    console.log(`${'\n\n'}=== PUT userId ===${'\n\n'}`, userId);
    const prevTatoe = yield prisma_1.prisma.tatoe.findUnique({
        where: { id },
        select: {
            userId: true,
            imageId: true,
        },
    });
    if (userId !== (prevTatoe === null || prevTatoe === void 0 ? void 0 : prevTatoe.userId)) {
        throw Error('例えを作成したユーザーではありません');
    }
    if (!file) {
        console.log('画像データがないため画像は更新されません。');
    }
    let newImageId = prevTatoe.imageId;
    if (file) {
        try {
            newImageId = (0, nanoid_1.nanoid)();
            yield googleCloudStorage_1.googleStorage
                .bucket(googleCloudStorage_1.bucketName)
                .upload(`${file.path}`, {
                gzip: true,
                destination: `tatoe_images/${id}/${newImageId}`,
            });
        }
        catch (_c) {
            throw new Error('エラー');
        }
        finally {
            yield (0, promises_1.unlink)(file.path);
            console.log('File on dir uploads has been deleted');
        }
    }
    else if (prevTatoe.imageId) {
        console.log('There are no file or bucketName');
    }
    try {
        const tatoe = yield prisma_1.prisma.tatoe.update({
            where: { id },
            data: {
                userId,
                title,
                shortParaphrase,
                description,
                imageId: newImageId,
            },
        });
        const newTatoe = Object.assign(Object.assign({}, tatoe), { imageUrl: tatoe.imageId
                ? `${process.env.BACKEND_URL}tatoe/${tatoe.id}/explanation_image/${tatoe.imageId}`
                : null });
        res.json({ data: newTatoe });
        // const createdAt = tatoe.createdAt;
        // const formattedCreatedAt = formatDate(createdAt, dateFormat);
    }
    catch (_d) {
        throw Error('更新できませんでした');
    }
}));
router.delete('/:id', passport_1.default.authenticate('jwt', { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const { tId } = req.body;
    if (tId === id) {
        try {
            const tatoe = yield prisma_1.prisma.tatoe.delete({
                where: { id },
            });
            console.log(`${'\n\n'}=== DELETE ALL TATOE ===${'\n\n'}`, tatoe);
            res.json({ data: tatoe });
        }
        catch (_e) {
            throw Error('削除できませんでした');
        }
    }
}));
// 説明画像
router.get('/:id/explanation_image/:imageId', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id; // tId
    const imageId = req.params.imageId;
    console.log(`${'\n\n'}=== GET imageId ===${'\n\n'}`, imageId);
    console.log(`${'\n\n'}=== GET tId ===${'\n\n'}`, id);
    const file = googleCloudStorage_1.googleStorage
        .bucket(googleCloudStorage_1.bucketName)
        .file(`tatoe_images/${id}/${imageId}`);
    const [exists] = yield file.exists();
    console.log(`${'\n\n'}=== GET file exists ===${'\n\n'}`, exists);
    try {
        if (exists) {
            const stream = file.createReadStream();
            stream.on('error', (error) => {
                console.log(`GET Error ${error}`);
                res.statusCode = 500;
                res.end('500 error');
            });
            stream.pipe(res.header({ 'Content-Type': 'image/jpg' }));
        }
        else
            throw Error('画像がありません。');
    }
    catch (error) {
        console.error('GET IMAGE CATCH ERROR', error);
    }
}));
router.delete('/:id/explanation_image', passport_1.default.authenticate('jwt', { session: false }), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id; // tId
    const userId = req.user.id;
    console.log('======DELETE tId', id); // undefined
    const prevTatoe = yield prisma_1.prisma.tatoe.findUnique({
        where: { id },
    });
    if (!prevTatoe) {
        throw new Error('Tatoe not Found');
    }
    if (prevTatoe.userId !== userId) {
        throw new Error('本人以外画像を削除できません');
    }
    const file = googleCloudStorage_1.googleStorage
        .bucket(googleCloudStorage_1.bucketName)
        .file(`tatoe_images/${id}/${prevTatoe.imageId}`);
    const [exists] = yield file.exists();
    if (exists) {
        yield file.delete();
        console.log('File on GCS has been deleted');
    }
    const fixedTatoe = yield prisma_1.prisma.tatoe.update({
        where: { id },
        data: {
            imageId: null,
        },
    });
    res.json({
        data: Object.assign(Object.assign({}, fixedTatoe), { imageUrl: null }),
    });
}));
exports.default = router;
