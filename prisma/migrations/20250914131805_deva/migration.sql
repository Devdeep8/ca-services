-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('CA', 'Staff', 'Client');

-- CreateEnum
CREATE TYPE "public"."GSTINStatus" AS ENUM ('Active', 'Cancelled', 'Suspended');

-- CreateEnum
CREATE TYPE "public"."ReturnType" AS ENUM ('GSTR1', 'GSTR3B');

-- CreateEnum
CREATE TYPE "public"."FilingStatus" AS ENUM ('Draft', 'Filed', 'Processed', 'Rejected');

-- CreateEnum
CREATE TYPE "public"."ReminderType" AS ENUM ('Document', 'Filing', 'Payment');

-- CreateEnum
CREATE TYPE "public"."ReminderStatus" AS ENUM ('Pending', 'Sent', 'Acknowledged');

-- CreateEnum
CREATE TYPE "public"."AnalysisType" AS ENUM ('DataExtraction', 'Reconciliation', 'Advisory');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "google_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "pan" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Business" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GSTIN" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "gstin_number" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "registration_date" TIMESTAMP(3) NOT NULL,
    "status" "public"."GSTINStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GSTIN_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" SERIAL NOT NULL,
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

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GSTReturn" (
    "id" SERIAL NOT NULL,
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

    CONSTRAINT "GSTReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ITR" (
    "id" SERIAL NOT NULL,
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

    CONSTRAINT "ITR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reminder" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "reminder_type" "public"."ReminderType" NOT NULL,
    "status" "public"."ReminderStatus" NOT NULL,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AIAnalysis" (
    "id" SERIAL NOT NULL,
    "document_id" INTEGER,
    "gst_return_id" INTEGER,
    "itr_id" INTEGER,
    "analysis_type" "public"."AnalysisType" NOT NULL,
    "input_data" JSONB,
    "output_data" JSONB,
    "confidenceScore" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- AddForeignKey
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Business" ADD CONSTRAINT "Business_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GSTIN" ADD CONSTRAINT "GSTIN_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_gstin_id_fkey" FOREIGN KEY ("gstin_id") REFERENCES "public"."GSTIN"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GSTReturn" ADD CONSTRAINT "GSTReturn_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GSTReturn" ADD CONSTRAINT "GSTReturn_gstin_id_fkey" FOREIGN KEY ("gstin_id") REFERENCES "public"."GSTIN"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GSTReturn" ADD CONSTRAINT "GSTReturn_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ITR" ADD CONSTRAINT "ITR_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ITR" ADD CONSTRAINT "ITR_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reminder" ADD CONSTRAINT "Reminder_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reminder" ADD CONSTRAINT "Reminder_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIAnalysis" ADD CONSTRAINT "AIAnalysis_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIAnalysis" ADD CONSTRAINT "AIAnalysis_gst_return_id_fkey" FOREIGN KEY ("gst_return_id") REFERENCES "public"."GSTReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AIAnalysis" ADD CONSTRAINT "AIAnalysis_itr_id_fkey" FOREIGN KEY ("itr_id") REFERENCES "public"."ITR"("id") ON DELETE SET NULL ON UPDATE CASCADE;
