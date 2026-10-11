-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "pets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_assessments" (
    "id" TEXT NOT NULL,
    "pet_id" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "health_assessments_pet_id_idx" ON "health_assessments"("pet_id");

-- AddForeignKey
ALTER TABLE "health_assessments" ADD CONSTRAINT "health_assessments_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
