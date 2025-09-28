/*
  Warnings:

  - Made the column `birthPlace` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `institution` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "birthPlace" SET NOT NULL,
ALTER COLUMN "institution" SET NOT NULL;

-- AlterTable
ALTER TABLE "patient_records" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "patient_records_userId_idx" ON "patient_records"("userId");

-- AddForeignKey
ALTER TABLE "patient_records" ADD CONSTRAINT "patient_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
