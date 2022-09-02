-- CreateTable
CREATE TABLE "Tatoe" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Tatoe_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tatoe_userId_key" ON "Tatoe"("userId");

-- AddForeignKey
ALTER TABLE "Tatoe" ADD CONSTRAINT "Tatoe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
