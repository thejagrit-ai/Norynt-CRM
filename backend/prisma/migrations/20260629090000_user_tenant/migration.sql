-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" TEXT;

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

