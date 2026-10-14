-- Current PostgreSQL schema reference for the Day 4 T2 deployment setup.
-- The Prisma schema and PostgreSQL migration history are authoritative.
-- Initializing this schema creates tables only; it never imports SQLite data.

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "pets" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "species" TEXT NOT NULL,
  "age" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "health_assessments" (
  "id" TEXT NOT NULL,
  "pet_id" TEXT NOT NULL,
  "risk_level" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "health_assessments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "health_assessments_pet_id_idx"
  ON "health_assessments"("pet_id");

ALTER TABLE "health_assessments"
  ADD CONSTRAINT "health_assessments_pet_id_fkey"
  FOREIGN KEY ("pet_id") REFERENCES "pets"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "visitors" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "path" TEXT NOT NULL DEFAULT '/',
  CONSTRAINT "visitors_pkey" PRIMARY KEY ("id")
);
