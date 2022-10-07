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
const router = express_1.default.Router();
// ユーザーの例え一覧取得
router.get('/:userId/tatoe', passport_1.default.authenticate('jwt', { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = req.params.userId;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    console.log('@UserRouter GET userId', id);
    if (userId === id) {
        const userTatoe = yield prisma_1.prisma.tatoe.findMany({
            where: { userId: id },
        });
        const newUserTatoe = userTatoe.map((prevTatoe) => {
            const id = prevTatoe.id;
            const userId = prevTatoe.userId;
            const imageId = prevTatoe.imageId;
            const title = prevTatoe.title;
            const shortParaphrase = prevTatoe.shortParaphrase;
            const description = prevTatoe.description;
            const createdAt = prevTatoe.createdAt;
            const updatedAt = prevTatoe.updatedAt;
            const imageUrl = prevTatoe.imageId
                ? `${process.env.BACKEND_URL}tatoe/${prevTatoe.id}/explanation_image/${prevTatoe.imageId}`
                : null;
            return {
                id,
                userId,
                imageId,
                title,
                shortParaphrase,
                description,
                createdAt,
                updatedAt,
                imageUrl,
            };
        });
        res.json({ data: newUserTatoe });
    }
    else {
        res.json({ data: [] });
    }
}));
exports.default = router;
