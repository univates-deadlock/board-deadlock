-- CreateEnum
CREATE TYPE "CLIENT_TYPE" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "USER_ROLE" AS ENUM ('ADMIN', 'PLANNING', 'TECHNICIAN');

-- CreateEnum
CREATE TYPE "QUOTE_STATUS" AS ENUM ('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "QUOTE_ITEM_TYPE" AS ENUM ('PRODUCT', 'SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "SERVICE_ORIGIN" AS ENUM ('QUOTE', 'SUPPORT', 'MAINTENANCE', 'REVISION', 'WARRANTY', 'OTHER');

-- CreateEnum
CREATE TYPE "WARRANTY_TYPE" AS ENUM ('SERVICE', 'MANUFACTURER');

-- CreateEnum
CREATE TYPE "REVISION_STATUS" AS ENUM ('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "USER_ROLE" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client" (
    "id" UUID NOT NULL,
    "type" "CLIENT_TYPE" NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "document" VARCHAR(20),
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "contact_name" VARCHAR(200),
    "phone" VARCHAR(20),
    "whatsapp" VARCHAR(20) NOT NULL,
    "location" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100),

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "status" "QUOTE_STATUS" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "sent_at" TIMESTAMP(3),
    "decided_at" TIMESTAMP(3),
    "decision_notes" TEXT,
    "decision_evidence_url" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_item" (
    "id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "type" "QUOTE_ITEM_TYPE" NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "quote_id" UUID,
    "origin" "SERVICE_ORIGIN" NOT NULL,
    "status" VARCHAR(100) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "external_os_number" VARCHAR(100),
    "planned_start" TIMESTAMP(3),
    "planned_end" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_visit" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "scheduled_start" TIMESTAMP(3) NOT NULL,
    "scheduled_end" TIMESTAMP(3),
    "actual_start" TIMESTAMP(3),
    "actual_end" TIMESTAMP(3),
    "status" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_technician" (
    "visit_id" UUID NOT NULL,
    "technician_id" UUID NOT NULL,

    CONSTRAINT "visit_technician_pkey" PRIMARY KEY ("visit_id","technician_id")
);

-- CreateTable
CREATE TABLE "warranty" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "type" "WARRANTY_TYPE" NOT NULL,
    "description" TEXT,
    "manufacturer" VARCHAR(150),
    "product_reference" VARCHAR(200),
    "starts_at" DATE NOT NULL,
    "ends_at" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revision" (
    "id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "visit_id" UUID,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "REVISION_STATUS" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "client_email_key" ON "client"("email");

-- CreateIndex
CREATE INDEX "quote_client_id_idx" ON "quote"("client_id");

-- CreateIndex
CREATE INDEX "quote_created_by_idx" ON "quote"("created_by");

-- CreateIndex
CREATE INDEX "quote_status_idx" ON "quote"("status");

-- CreateIndex
CREATE INDEX "quote_item_quote_id_idx" ON "quote_item"("quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_quote_id_key" ON "service"("quote_id");

-- CreateIndex
CREATE INDEX "service_client_id_idx" ON "service"("client_id");

-- CreateIndex
CREATE INDEX "service_created_by_idx" ON "service"("created_by");

-- CreateIndex
CREATE INDEX "service_status_idx" ON "service"("status");

-- CreateIndex
CREATE INDEX "service_planned_start_idx" ON "service"("planned_start");

-- CreateIndex
CREATE INDEX "service_visit_service_id_idx" ON "service_visit"("service_id");

-- CreateIndex
CREATE INDEX "service_visit_scheduled_start_idx" ON "service_visit"("scheduled_start");

-- CreateIndex
CREATE INDEX "service_visit_status_idx" ON "service_visit"("status");

-- CreateIndex
CREATE INDEX "visit_technician_technician_id_idx" ON "visit_technician"("technician_id");

-- CreateIndex
CREATE INDEX "warranty_service_id_idx" ON "warranty"("service_id");

-- CreateIndex
CREATE INDEX "warranty_ends_at_idx" ON "warranty"("ends_at");

-- CreateIndex
CREATE INDEX "warranty_type_idx" ON "warranty"("type");

-- CreateIndex
CREATE INDEX "revision_service_id_idx" ON "revision"("service_id");

-- CreateIndex
CREATE INDEX "revision_visit_id_idx" ON "revision"("visit_id");

-- CreateIndex
CREATE INDEX "revision_scheduled_at_idx" ON "revision"("scheduled_at");

-- CreateIndex
CREATE INDEX "revision_status_idx" ON "revision"("status");

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_item" ADD CONSTRAINT "quote_item_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service" ADD CONSTRAINT "service_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_visit" ADD CONSTRAINT "service_visit_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_technician" ADD CONSTRAINT "visit_technician_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "service_visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_technician" ADD CONSTRAINT "visit_technician_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty" ADD CONSTRAINT "warranty_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revision" ADD CONSTRAINT "revision_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revision" ADD CONSTRAINT "revision_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "service_visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
