/*
  Warnings:

  - A unique constraint covering the columns `[instanceId,gpsTime]` on the table `operational_data` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "operational_data_instanceId_gpsTime_key" ON "operational_data"("instanceId", "gpsTime");
