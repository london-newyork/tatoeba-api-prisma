import { Storage } from '@google-cloud/storage';
import multer from 'multer';

const thisProjectId = process.env.GCS_PROJECT_ID;
const keyFilename = process.env.GCS_SERVICE_KEY_PATH;

const bucketName = process.env.GCS_BUCKET_NAME;
const googleStorage = new Storage({
  projectId: thisProjectId,
  keyFilename: keyFilename,
});

// Multerを使ってファイル名を書き換える
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

export { bucketName, googleStorage, upload };
