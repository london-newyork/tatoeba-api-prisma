-- CreateTable
CREATE TABLE "Registration" (
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("token")
);

-- CreateIndex
CREATE UNIQUE INDEX "Registration_email_key" ON "Registration"("email");
