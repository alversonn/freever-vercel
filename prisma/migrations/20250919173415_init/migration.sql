-- CreateTable
CREATE TABLE "patient_records" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "pulseWeak" BOOLEAN NOT NULL,
    "consciousnessPoor" BOOLEAN NOT NULL,
    "oxygenSaturation" REAL NOT NULL,
    "leukocyteCount" REAL NOT NULL,
    "neutrophilCount" REAL NOT NULL,
    "lymphocyteCount" REAL NOT NULL,
    "crpLevel" REAL NOT NULL,
    "feverDuration" INTEGER NOT NULL,
    "nlcrResult" REAL NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL
);
