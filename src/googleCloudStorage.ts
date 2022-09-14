import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';

//'{秘密鍵の場所}';
const keyFilename = process.env.GCS_SERVICE_KEY_PATH;

//'{任意の名前で作成したバケット名}';
const bucketName = process.env.GCS_BUCKET_NAME;

// バケットの取得
const storage = new Storage({ keyFilename: keyFilename });
const bucket = storage.bucket(bucketName as string);

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
    const file = await bucket.getFiles({ prefix: `tatoe/${tId}/` });
    console.log(file[0]);
  }
  // users/userId/userのアバター
  if (userId) {
    const file = await bucket.getFiles({ prefix: `users/${userId}/` });
    console.log(file[0]);
  }
};

// ファイルアップロード
const googleCloudStorageUploadFile = async (
  filePath: string,
  fileName: string
) => {
  // 例 filePath : 'dest/example.txt'
  // 例 fileName : 'example.txt'
  await bucket.upload(fileName, { destination: filePath });
};

// ファイル削除
const googleCloudStorageDeleteFile = async (filePath: string) => {
  // 例 filePath : 'dest/example.txt'
  await bucket.file(filePath).delete();
};

export {
  googleCloudStorageUploadFile,
  googleCloudStorageReadFile,
  googleCloudStorageDeleteFile,
};
