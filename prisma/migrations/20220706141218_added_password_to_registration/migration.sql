/*
  Warnings:

  - A unique constraint covering the columns `[password]` on the table `Registration` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `password` to the `Registration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "password" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Registration_password_key" ON "Registration"("password");
