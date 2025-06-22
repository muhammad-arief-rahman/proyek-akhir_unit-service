/*
  Warnings:

  - A unique constraint covering the columns `[unitId,serialNo]` on the table `unit_instances` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "unit_instances" ADD COLUMN "organizationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "unit_instances_unitId_serialNo_key" ON "unit_instances"("unitId", "serialNo");
