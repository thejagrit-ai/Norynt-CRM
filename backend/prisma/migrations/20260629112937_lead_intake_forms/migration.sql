-- CreateEnum
CREATE TYPE "LeadChannel" AS ENUM ('MANUAL', 'IMPORT', 'FORM', 'WEBHOOK', 'API');

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "channel" "LeadChannel" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "formId" TEXT,
ADD COLUMN     "meta" JSONB;

-- CreateTable
CREATE TABLE "LeadForm" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "name" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "buttonColor" TEXT NOT NULL DEFAULT '#4f46e5',
    "buttonLabel" TEXT NOT NULL DEFAULT 'Gönder',
    "successMessage" TEXT,
    "redirectUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "submitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeadForm_publicKey_key" ON "LeadForm"("publicKey");

-- CreateIndex
CREATE INDEX "LeadForm_tenantId_idx" ON "LeadForm"("tenantId");

-- CreateIndex
CREATE INDEX "Lead_channel_idx" ON "Lead"("channel");

-- CreateIndex
CREATE INDEX "Lead_formId_idx" ON "Lead"("formId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_formId_fkey" FOREIGN KEY ("formId") REFERENCES "LeadForm"("id") ON DELETE SET NULL ON UPDATE CASCADE;
