"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.googleStorage = exports.bucketName = void 0;
const storage_1 = require("@google-cloud/storage");
const multer_1 = __importDefault(require("multer"));
const thisProjectId = process.env.GCS_PROJECT_ID;
const keyFilename = process.env.GCS_SERVICE_KEY_PATH;
const bucketName = process.env.GCS_BUCKET_NAME;
exports.bucketName = bucketName;
const googleStorage = new storage_1.Storage({
    projectId: thisProjectId,
    keyFilename: keyFilename,
});
exports.googleStorage = googleStorage;
// Multerを使ってファイル名を書き換える
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
const upload = (0, multer_1.default)({ storage: storage });
exports.upload = upload;
if (!bucketName) {
    throw new Error('Bucket Name is not defined on process.env');
}
