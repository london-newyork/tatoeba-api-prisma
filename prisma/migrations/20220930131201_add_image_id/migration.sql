/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Tatoe` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tatoe" DROP COLUMN "imageUrl",
ADD COLUMN     "imageId" TEXT;
