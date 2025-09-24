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
    "nausea" BOOLEAN NOT NULL DEFAULT false,
    "vomiting" BOOLEAN NOT NULL DEFAULT false,
    "lossOfAppetite" BOOLEAN NOT NULL DEFAULT false,
    "severeBleeding" BOOLEAN NOT NULL DEFAULT false,
    "respiratoryProblems" BOOLEAN NOT NULL DEFAULT false,
    "seizure" BOOLEAN NOT NULL DEFAULT false,
    "severeDehydration" BOOLEAN NOT NULL DEFAULT false,
    "shockSign" BOOLEAN NOT NULL DEFAULT false,
    "diagnosis" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "sensitivity" REAL NOT NULL DEFAULT 0,
    "specificity" REAL NOT NULL DEFAULT 0
);
INSERT INTO "new_patient_records" ("age", "consciousnessPoor", "createdAt", "crpLevel", "dateOfBirth", "diagnosis", "feverDuration", "gender", "id", "leukocyteCount", "lossOfAppetite", "lymphocyteCount", "name", "nausea", "neutrophilCount", "nlcrResult", "oxygenSaturation", "pulseWeak", "recommendation", "respiratoryProblems", "seizure", "severeBleeding", "severeDehydration", "shockSign", "vomiting") SELECT "age", "consciousnessPoor", "createdAt", "crpLevel", "dateOfBirth", "diagnosis", "feverDuration", "gender", "id", "leukocyteCount", "lossOfAppetite", "lymphocyteCount", "name", "nausea", "neutrophilCount", "nlcrResult", "oxygenSaturation", "pulseWeak", "recommendation", "respiratoryProblems", "seizure", "severeBleeding", "severeDehydration", "shockSign", "vomiting" FROM "patient_records";
DROP TABLE "patient_records";
ALTER TABLE "new_patient_records" RENAME TO "patient_records";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
