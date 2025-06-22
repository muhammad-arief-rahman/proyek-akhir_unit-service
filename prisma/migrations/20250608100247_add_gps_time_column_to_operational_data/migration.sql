/*
  Warnings:

  - You are about to drop the column `name` on the `units` table. All the data in the column will be lost.
  - Added the required column `gpsTime` to the `operational_data` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelType` to the `units` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_operational_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workHours" REAL NOT NULL,
    "actualWorkHours" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "latitude" REAL NOT NULL,
    "fuelUsage" REAL NOT NULL,
    "gpsTime" DATETIME NOT NULL,
    "instanceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "operational_data_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "unit_instances" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_operational_data" ("actualWorkHours", "createdAt", "fuelUsage", "id", "instanceId", "latitude", "longitude", "updatedAt", "workHours") SELECT "actualWorkHours", "createdAt", "fuelUsage", "id", "instanceId", "latitude", "longitude", "updatedAt", "workHours" FROM "operational_data";
DROP TABLE "operational_data";
ALTER TABLE "new_operational_data" RENAME TO "operational_data";
CREATE TABLE "new_units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_units" ("createdAt", "id", "manufacturer", "model", "type", "updatedAt") SELECT "createdAt", "id", "manufacturer", "model", "type", "updatedAt" FROM "units";
DROP TABLE "units";
ALTER TABLE "new_units" RENAME TO "units";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
