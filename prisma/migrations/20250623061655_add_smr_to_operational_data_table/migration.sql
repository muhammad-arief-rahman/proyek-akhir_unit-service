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
    "smr" REAL NOT NULL DEFAULT 0,
    "instanceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "operational_data_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "unit_instances" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_operational_data" ("actualWorkHours", "createdAt", "fuelUsage", "gpsTime", "id", "instanceId", "latitude", "longitude", "updatedAt", "workHours") SELECT "actualWorkHours", "createdAt", "fuelUsage", "gpsTime", "id", "instanceId", "latitude", "longitude", "updatedAt", "workHours" FROM "operational_data";
DROP TABLE "operational_data";
ALTER TABLE "new_operational_data" RENAME TO "operational_data";
CREATE UNIQUE INDEX "operational_data_instanceId_gpsTime_key" ON "operational_data"("instanceId", "gpsTime");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
