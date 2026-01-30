-- CreateEnum
CREATE TYPE "ClinicRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CLINIC';

-- CreateTable
CREATE TABLE "clinics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "clinic_name" TEXT NOT NULL,
    "identification_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "clinic_name" TEXT NOT NULL,
    "identification_number" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "status" "ClinicRequestStatus" NOT NULL DEFAULT 'PENDING',
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinics_identification_number_key" ON "clinics"("identification_number");

-- AddForeignKey
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinic_requests" ADD CONSTRAINT "clinic_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
