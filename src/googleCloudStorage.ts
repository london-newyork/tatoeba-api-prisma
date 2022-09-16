import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';
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

// ファイル取得
type UserId = { userId?: string };
type TId = { tId?: string };

type ReadFile = UserId & TId;

const googleCloudStorageReadFile = async (prefix: ReadFile) => {
  // 例 prefix: 'dest/'
  // tatoe/tId/の例えに紐づく投稿画像
  const tId = prefix.tId;
  const userId = prefix.userId;

  if (tId) {
    // const file = await googleStorage.bucket(bucketName as string).getFiles({
    //   prefix: `tatoe/${tId}/`,
    // });
    // console.log(file[0]);
  }
  // users/userId/userのアバター
  if (userId) {
    // const file = await googleStorage.bucket(bucketName as string).getFiles({
    //   prefix: `users/${userId}/`,
    // });
    // console.log(file[0]);
  }
};

// ファイルアップロード
type UploadFile = {
  // req: express.Request;
  destinationFilePath: string;
  fileName: string;
};
const googleCloudStorageUploadFile = async ({}: // req,
// destinationFilePath,
// fileName,
UploadFile) => {
  // 例 filePath : 'dest/example.txt'
  // 例 fileName : 'example.txt'
  // await googleStorage.bucket(bucketName as string).upload(fileName, {
  //   destination: destinationFilePath,
  // });
};

// ファイル削除
const googleCloudStorageDeleteFile = async (destinationFilePath: string) => {
  // 例 filePath : 'dest/example.txt'
  await googleStorage
    .bucket(bucketName as string)
    .file(destinationFilePath)
    .delete();
};

export {
  googleCloudStorageUploadFile,
  googleCloudStorageReadFile,
  googleCloudStorageDeleteFile,
  bucketName,
  googleStorage,
  upload,
};
