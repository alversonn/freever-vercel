/*
  Warnings:

  - You are about to drop the column `address` on the `patient_records` table. All the data in the column will be lost.
  - Made the column `dateOfBirth` on table `patient_records` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_patient_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "pulseWeak" BOOLEAN NOT NULL,
    "consciousnessPoor" BOOLEAN NOT NULL,
    "oxygenSaturation" REAL NOT NULL,
    "leukocyteCount" REAL NOT NULL,
    "neutrophilCount" REAL NOT NULL,
    "lymphocyteCount" REAL NOT NULL,
    "crpLevel" REAL,
    "feverDuration" INTEGER NOT NULL,
    "nlcrResult" REAL NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL
);
INSERT INTO "new_patient_records" ("age", "consciousnessPoor", "createdAt", "crpLevel", "dateOfBirth", "diagnosis", "feverDuration", "gender", "id", "leukocyteCount", "lymphocyteCount", "name", "neutrophilCount", "nlcrResult", "oxygenSaturation", "pulseWeak", "recommendation") SELECT "age", "consciousnessPoor", "createdAt", "crpLevel", "dateOfBirth", "diagnosis", "feverDuration", "gender", "id", "leukocyteCount", "lymphocyteCount", "name", "neutrophilCount", "nlcrResult", "oxygenSaturation", "pulseWeak", "recommendation" FROM "patient_records";
DROP TABLE "patient_records";
ALTER TABLE "new_patient_records" RENAME TO "patient_records";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
