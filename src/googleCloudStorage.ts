import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';

//'{秘密鍵の場所}';
const thisProjectId = process.env.GCS_PROJECT_ID;
const keyFilename = process.env.GCS_SERVICE_KEY_PATH;

//'{任意の名前で作成したバケット名}';
const bucketName = process.env.GCS_BUCKET_NAME;

// バケットの取得
const storage = new Storage({
  projectId: thisProjectId,
  keyFilename: keyFilename,
});
const bucket = storage.bucket(bucketName as string);

// テストでファイル取得
const getGoogleCloudStorageInfo = async () => {
  // const file = await bucket.getFiles({
  //   prefix: '/',
  //   autoPaginate: false,
  //   delimiter: '/',
  // });
  // console.log(file[0]);
  bucket
    .getFiles()
    .then((data) => {
      let files = data[0];
      files.forEach((file) => {
        console.log(file.name);
      });
    })
    .catch((ex) => console.log(ex));
};

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
type UploadFile = {
  destinationFilePath: string;
  fileName: string;
};
const googleCloudStorageUploadFile = async ({
  destinationFilePath,
  fileName,
}: UploadFile) => {
  // 例 filePath : 'dest/example.txt'
  // 例 fileName : 'example.txt'
  await bucket.upload(fileName, { destination: destinationFilePath });
};

// ファイル削除
const googleCloudStorageDeleteFile = async (destinationFilePath: string) => {
  // 例 filePath : 'dest/example.txt'
  await bucket.file(destinationFilePath).delete();
};

export {
  googleCloudStorageUploadFile,
  googleCloudStorageReadFile,
  googleCloudStorageDeleteFile,
  getGoogleCloudStorageInfo,
};
