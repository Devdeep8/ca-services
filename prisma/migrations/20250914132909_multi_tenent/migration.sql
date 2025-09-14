/*
  Warnings:

  - You are about to drop the `AIAnalysis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GSTIN` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GSTReturn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ITR` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reminder` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `organization_id` to the `Business` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."OrgUserRole" AS ENUM ('Admin', 'Member');

-- DropForeignKey
ALTER TABLE "public"."AIAnalysis" DROP CONSTRAINT "AIAnalysis_document_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."AIAnalysis" DROP CONSTRAINT "AIAnalysis_gst_return_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."AIAnalysis" DROP CONSTRAINT "AIAnalysis_itr_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Business" DROP CONSTRAINT "Business_client_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Client" DROP CONSTRAINT "Client_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_business_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_gstin_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Document" DROP CONSTRAINT "Document_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."GSTIN" DROP CONSTRAINT "GSTIN_business_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."GSTReturn" DROP CONSTRAINT "GSTReturn_business_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."GSTReturn" DROP CONSTRAINT "GSTReturn_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."GSTReturn" DROP CONSTRAINT "GSTReturn_gstin_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ITR" DROP CONSTRAINT "ITR_business_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."ITR" DROP CONSTRAINT "ITR_created_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."Reminder" DROP CONSTRAINT "Reminder_business_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Reminder" DROP CONSTRAINT "Reminder_created_by_fkey";

-- AlterTable
ALTER TABLE "public"."Business" ADD COLUMN     "organization_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."AIAnalysis";

-- DropTable
DROP TABLE "public"."Client";

-- DropTable
DROP TABLE "public"."Document";

-- DropTable
DROP TABLE "public"."GSTIN";

-- DropTable
DROP TABLE "public"."GSTReturn";

-- DropTable
DROP TABLE "public"."ITR";

-- DropTable
DROP TABLE "public"."Reminder";

-- CreateTable
CREATE TABLE "public"."Organization" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Membership" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "public"."OrgUserRole" NOT NULL DEFAULT 'Member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clients" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "pan" TEXT,
    "address" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gstins" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "business_id" INTEGER NOT NULL,
    "gstin_number" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "registration_date" TIMESTAMP(3) NOT NULL,
    "status" "public"."GSTINStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gstins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."documents" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "business_id" INTEGER NOT NULL,
    "gstin_id" INTEGER,
    "uploaded_by" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "extracted_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gst_returns" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "business_id" INTEGER NOT NULL,
    "gstin_id" INTEGER NOT NULL,
    "return_type" "public"."ReturnType" NOT NULL,
    "periodMonth" INTEGER NOT NULL,
    "periodYear" INTEGER NOT NULL,
    "filing_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "status" "public"."FilingStatus" NOT NULL,
    "data" JSONB,
    "reconciliation_notes" TEXT,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gst_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itrs" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "business_id" INTEGER NOT NULL,
    "assessment_year" INTEGER NOT NULL,
    "itr_type" TEXT NOT NULL,
    "filing_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "status" "public"."FilingStatus" NOT NULL,
    "data" JSONB,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itrs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reminders" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "business_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "reminder_type" "public"."ReminderType" NOT NULL,
    "status" "public"."ReminderStatus" NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ai_analyses" (
    "id" SERIAL NOT NULL,
    "organization_id" INTEGER NOT NULL,
    "document_id" INTEGER,
    "gst_return_id" INTEGER,
    "itr_id" INTEGER,
    "analysis_type" "public"."AnalysisType" NOT NULL,
    "input_data" JSONB,
    "output_data" JSONB,
    "confidenceScore" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clients_organization_id_idx" ON "public"."clients"("organization_id");

-- CreateIndex
CREATE INDEX "gstins_organization_id_idx" ON "public"."gstins"("organization_id");

-- CreateIndex
CREATE INDEX "gstins_business_id_idx" ON "public"."gstins"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "gstins_organization_id_gstin_number_key" ON "public"."gstins"("organization_id", "gstin_number");

-- CreateIndex
CREATE INDEX "documents_organization_id_idx" ON "public"."documents"("organization_id");

-- CreateIndex
CREATE INDEX "documents_business_id_idx" ON "public"."documents"("business_id");

-- CreateIndex
CREATE INDEX "gst_returns_organization_id_idx" ON "public"."gst_returns"("organization_id");

-- CreateIndex
CREATE INDEX "gst_returns_business_id_idx" ON "public"."gst_returns"("business_id");

-- CreateIndex
CREATE INDEX "itrs_organization_id_idx" ON "public"."itrs"("organization_id");

-- CreateIndex
CREATE INDEX "itrs_business_id_idx" ON "public"."itrs"("business_id");

-- CreateIndex
CREATE INDEX "reminders_organization_id_idx" ON "public"."reminders"("organization_id");

-- CreateIndex
CREATE INDEX "reminders_business_id_idx" ON "public"."reminders"("business_id");

-- CreateIndex
CREATE INDEX "ai_analyses_organization_id_idx" ON "public"."ai_analyses"("organization_id");

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Membership" ADD CONSTRAINT "Membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clients" ADD CONSTRAINT "clients_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clients" ADD CONSTRAINT "clients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Business" ADD CONSTRAINT "Business_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Business" ADD CONSTRAINT "Business_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gstins" ADD CONSTRAINT "gstins_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gstins" ADD CONSTRAINT "gstins_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_gstin_id_fkey" FOREIGN KEY ("gstin_id") REFERENCES "public"."gstins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gst_returns" ADD CONSTRAINT "gst_returns_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gst_returns" ADD CONSTRAINT "gst_returns_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gst_returns" ADD CONSTRAINT "gst_returns_gstin_id_fkey" FOREIGN KEY ("gstin_id") REFERENCES "public"."gstins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gst_returns" ADD CONSTRAINT "gst_returns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itrs" ADD CONSTRAINT "itrs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itrs" ADD CONSTRAINT "itrs_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itrs" ADD CONSTRAINT "itrs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminders" ADD CONSTRAINT "reminders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminders" ADD CONSTRAINT "reminders_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reminders" ADD CONSTRAINT "reminders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_analyses" ADD CONSTRAINT "ai_analyses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_analyses" ADD CONSTRAINT "ai_analyses_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_analyses" ADD CONSTRAINT "ai_analyses_gst_return_id_fkey" FOREIGN KEY ("gst_return_id") REFERENCES "public"."gst_returns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_analyses" ADD CONSTRAINT "ai_analyses_itr_id_fkey" FOREIGN KEY ("itr_id") REFERENCES "public"."itrs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
